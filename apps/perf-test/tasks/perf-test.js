const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const generateFlamegraph = require('./flamegraph/generateFlamegraph');
const { argv } = require('@uifabric/build').just;

// A high number of iterations are needed to get visualization of lower level calls that are infrequently hit by ticks.
// Wiki: https://github.com/OfficeDev/office-ui-fabric-react/wiki/Perf-Testing
const iterationsDefault = 5000;

// Chrome command for running similarly configured instance of Chrome as puppeteer is configured here:
// "C:\Program Files (x86)\Google\Chrome\Application\chrome" --no-sandbox --js-flags=" --logfile=C:\git\perf\output\chrome.log --prof --jitless --no-opt" --user-data-dir="C:\git\perf\user" http://localhost:4322

// Current commands to run:
//    rush build --to perf-test
//    From apps/perf-test directory:
//      To build and run perf-test:
//        npm run just perf-test
//      To just run perf tests:
//        npm run just run-perf-test
// Arguments:
//    scenarios: comma separated list of scenario names to execute
//    iterations: number of iterations to run for each scenario
// Example:
//    npm run just perf-test -- --scenarios SplitButton,SplitButtonNew --iterations 1000

// TODO:
//  - Compare results with and without V8 flags. Make sure things that appear to be bottlenecks are consistent regardless of flags.
//  - Watch mode for flamegraphs.
//    - Would require going back to webserve config mode?
//  - Explore impact of:
//    - https://github.com/OfficeDev/office-ui-fabric-react/pull/9580
//    - https://github.com/OfficeDev/office-ui-fabric-react/pull/9432
//  - Figure out what is causing huge log file size differences between Windows and Mac. (mac perf is pretty bad)
//  - Verify results are repeatable and consistent
//    - 1 tab vs. 100 tabs simulateneously
//    - Eliminate or account for variance!
//    - Minimize scenarios.
//  - Tick Processing
//      - Flags:" https://github.com/v8/v8/blob/master/tools/tickprocessor.js"
//      - Use same version of V8 in Puppeteer to process ticks, somehow
//        - If not, need to remove "Testing v8 version different from logging version" from processed logs
//  - How will pass/fail be determined?
//    - What role should React measurements play in results?
//  - Use debug version of React to make results more readable? (Where time in React is being spent?)
//  - Scaling issues:
//    - Is already taking 10 minutes on CI. If users add scenarios it could get out of control.
//    - Options:
//      - Don't test master, just use posted results.
//        - If master has a "bad" variance, this result will be frozen. May be ok since it can happen on PRs too.
//      - Reduce default number iterations
//      - Allow varying iterations by scenario (for "problem" components like DocumentCardTitle)
//        - This may not be good if these components don't "stand out" as much with high samples.
//  - Further ideas:
//    - Resizing page to determine reflow
//    - React cascading updates on initial component render.
//    - Monomorphic vs. Megamorphic Analysis:
//      - Sean Larkin said that switching from polymorphic to monomorphic was a webpack optimization.
//      - https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html
//      - https://dzone.com/articles/impact-of-polymorphism-on-component-based-framewor

// TODO: other args?
// https://github.com/v8/v8/blob/master/src/flags/flag-definitions.h
//  --log-timer-events
//  --log-source-code

const urlForDeployPath = process.env.BUILD_SOURCEBRANCH
  ? `http://fabricweb.z5.web.core.windows.net/pr-deploy-site/${process.env.BUILD_SOURCEBRANCH}/perf-test`
  : 'file://' + path.resolve(__dirname, '../dist/');

const urlForDeploy = urlForDeployPath + '/index.html';

const urlForMaster = process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
  ? `http://fabricweb.z5.web.core.windows.net/pr-deploy-site/refs/heads/${process.env.SYSTEM_PULLREQUEST_TARGETBRANCH}/perf-test/index.html`
  : 'http://fabricweb.z5.web.core.windows.net/pr-deploy-site/refs/heads/master/perf-test/index.html';

const logPath = path.join(__dirname, '../logfiles');
const logFilePath = path.join(logPath, '/puppeteer.log');
const resultsPath = path.join(__dirname, '../dist');

module.exports = async function getPerfRegressions() {
  if (!fs.existsSync(logPath)) {
    console.log(`Making logfile directory ${logFilePath}...`);
    fs.mkdirSync(logPath);
  }

  const logfileContents = fs.readdirSync(logPath);

  if (logfileContents.length > 0) {
    console.log(`Unexpected logfiles already present in ${logPath}`);
    logfileContents.forEach(logFile => {
      const logFilePath = path.join(logPath, logFile);
      console.log(`Deleting ${logFilePath}`);
      fs.unlinkSync(logFilePath);
    });
  }

  const iterationsArg = Number.isInteger(argv().iterations) && argv().iterations;
  const iterations = iterationsArg || iterationsDefault;

  const scenariosAvailable = fs
    .readdirSync(path.join(__dirname, '../src/scenarios'))
    .filter(name => name.indexOf('scenarioList') < 0)
    .map(name => path.basename(name, '.tsx'));

  const scenariosArg = (argv().scenarios && argv().scenarios.split && argv().scenarios.split(',')) || [];
  scenariosArg.forEach(scenario => {
    if (!scenariosAvailable.includes(scenario)) {
      throw new Error(`Invalid scenario: ${scenario}.`);
    }
  });

  const scenarioNames = require('../src/scenarioNames');

  const scenarios = scenariosArg.length > 0 ? scenariosArg : scenariosAvailable;

  console.log(`\nRunning ${iterations} iterations for each of these scenarios: ${scenarios}\n`);

  // const extraV8Flags = '--log-source-code --log-timer-events';
  // const extraV8Flags = '--log-source-code';
  const extraV8Flags = '';
  const browser = await require('puppeteer').launch({
    headless: true,
    args: [
      '--flag-switches-begin',
      '--no-sandbox',
      '--js-flags=--logfile=' + logFilePath + ' --prof --jitless --no-opt ' + extraV8Flags,
      '--flag-switches-end'
    ]
  });

  // A log file is made for each new tab/page.
  // Make an initial page here to force generation of initial system logs that we are not concerned with.
  // This allows us to associate newly created log files with tests as we run each scenario in a new tab.
  await browser.newPage();

  // TODO: Need to decide whether it's ok to run tests in parallel. Variance from results seems to indicate
  // not, but then again other things outside of our control will also affect CPU load and results.
  // Run tests sequentially for now, at least as a chance of getting more consistent results when run locally.
  const testResults = [];

  for (const scenario of scenarios) {
    let logfileMaster = await runPerfTest(browser, urlForMaster, scenario, iterations, logPath);
    let logfilePR = await runPerfTest(browser, urlForDeploy, scenario, iterations, logPath);

    let outfileMaster = path.join(resultsPath, `${scenario}_master.html`);
    let outfilePR = path.join(resultsPath, `${scenario}_pr.html`);

    testResults.push({
      scenario: scenarioNames[scenario] || scenario,
      logfileMaster,
      outfileMaster,
      logfilePR,
      outfilePR
    });
  }

  console.log('testResults: ' + JSON.stringify(testResults));

  // Clean up
  await browser.close();

  // Serialize a bunch of async generation of flamegraphs
  for (const result of testResults) {
    await generateFlamegraph(result.logfileMaster, result.outfileMaster);
    await generateFlamegraph(result.logfilePR, result.outfilePR);
  }

  const comment = createTestSummary(testResults);

  // TODO: determine status according to perf numbers
  const status = 'success';

  console.log(`Perf evaluation status: ${status}`);
  console.log(`Writing comment to file:\n${comment}`);

  // Write results to file
  fs.writeFileSync(path.join(resultsPath, 'perfCounts.html'), comment);

  console.log(`##vso[task.setvariable variable=PerfCommentFilePath;]apps/perf-test/dist/perfCounts.html`);
  console.log(`##vso[task.setvariable variable=PerfCommentStatus;]${status}`);
};

/**
 *
 * @param {*} browser Launched puppeteer instance.
 * @param {string} baseUrl Base URL supporting 'scenario' and 'iterations' query parameters.
 * @param {string} scenarioName Name of scenario that will be used with baseUrl.
 * @param {number} iterations Number of iterations to run.
 * @param {string} logPath Absolute path to output log profiles.
 */
async function runPerfTest(browser, baseUrl, scenarioName, iterations, logPath) {
  const testUrl = `${baseUrl}?scenario=${scenarioName}&iterations=${iterations}`;
  const logFilesBefore = fs.readdirSync(logPath);

  const page = await browser.newPage();

  // Default timeout is 30 seconds. This is good for most tests except for problematic components like DocumentCardTitle.
  // Disable timeout for now and tweak to a maximum setting once server condtiions are better known.
  page.setDefaultTimeout(0);

  const logFilesAfter = fs.readdirSync(logPath);

  const testLogFile = arr_diff(logFilesBefore, logFilesAfter);

  if (testLogFile.length !== 1) {
    // We have to be able to identify log file associated with tab. Throw error if we can't.
    throw new Error(`Could not determine log file for ${baseUrl}. Log files detected: [ ${testLogFile} ]`);
  }

  console.log(`Starting test for ${scenarioName} at ${testUrl}`);

  console.time('Ran perf test in');
  await page.goto(testUrl);
  console.timeEnd('Ran perf test in');

  console.log('testLogFile: ' + testLogFile[0]);

  await page.close();

  return path.join(logPath, testLogFile[0]);
}

/**
 * Create test summary based on test results.
 */
function createTestSummary(testResults) {
  testResults.forEach(testResult => {
    testResult.numTicksMaster = getTicks(testResult.outfileMaster);
    testResult.numTicksPR = getTicks(testResult.outfilePR);
  });

  const result = `Component Perf Analysis:
  <table>
  <tr>
    <th>Scenario</th>
    <th>Master Samples *</th>
    <th>PR Samples *</th>
  </tr>`.concat(
    testResults
      .map(
        testResult =>
          `<tr>
            <td>${testResult.scenario}</td>
            <td><a href="${urlForDeployPath}/${path.basename(testResult.outfileMaster)}">${testResult.numTicksMaster}</a></td>
            <td><a href="${urlForDeployPath}/${path.basename(testResult.outfilePR)}">${testResult.numTicksPR}</a></td>
           </tr>`
      )
      .join('\n')
      .concat(`</table>`)
      .concat("* Sample counts can vary by up to 30% and shouldn't be used solely for determining regression.  ")
      .concat('For more information please see the ')
      .concat('<a href="https://github.com/OfficeDev/office-ui-fabric-react/wiki/Perf-Testing">Perf Testing wiki</a>.')
  );

  console.log('result: ' + result);

  return result;
}

/**
 * Get ticks from flamegraph file.
 *
 * @param {*} resultsFile
 */
function getTicks(resultsFile) {
  const numTicks = fs
    .readFileSync(resultsFile, 'utf8')
    .toString()
    .match(/numTicks\s?\=\s?([0-9]+)/);

  if (numTicks && numTicks[1]) {
    console.log('numTicks: ' + numTicks[1]);
    return numTicks[1];
  } else {
    console.log('Could not read numTicks from ' + resultsFile);
    return 'n/a';
  }
}

/**
 * Array diff utility that returns a list of elements that are not present in both arrays.
 *
 * @param {Array} a1 First array
 * @param {Array} a2 Second array
 */
function arr_diff(a1, a2) {
  var a = [],
    diff = [];

  for (var i = 0; i < a1.length; i++) {
    a[a1[i]] = true;
  }

  for (var i = 0; i < a2.length; i++) {
    if (a[a2[i]]) {
      delete a[a2[i]];
    } else {
      a[a2[i]] = true;
    }
  }

  for (var k in a) {
    diff.push(k);
  }

  return diff;
}

if (require.main === module) {
  // Can paste "testResults" console output here for testing.
  const results = [];
  createTestSummary(results);
}
