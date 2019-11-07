  // Your use of the content in the files referenced here is subject to the terms of the license at https://aka.ms/fabric-assets-license

// tslint:disable:max-line-length

import {
  IIconOptions,
  IIconSubset,
  registerIcons
} from '@uifabric/styling';

export function initializeIcons(
  baseUrl: string = '',
  options?: IIconOptions
): void {
  const subset: IIconSubset = {
    style: {
      MozOsxFontSmoothing: 'grayscale',
      WebkitFontSmoothing: 'antialiased',
      fontStyle: 'normal',
      fontWeight: 'normal',
      speak: 'none'
    },
    fontFace: {
      fontFamily: `"FabricMDL2Icons-8"`,
      src: `url('${baseUrl}fabric-icons-8-6fdf1528.woff') format('woff')`
    },
    icons: {
      'CollapseMenu': '\uEF66',
      'ExpandMenu': '\uEF67',
      'Boards': '\uEF68',
      'SunAdd': '\uEF69',
      'SunQuestionMark': '\uEF6A',
      'LandscapeOrientation': '\uEF6B',
      'DocumentSearch': '\uEF6C',
      'PublicCalendar': '\uEF6D',
      'PublicContactCard': '\uEF6E',
      'PublicEmail': '\uEF6F',
      'PublicFolder': '\uEF70',
      'WordDocument': '\uEF71',
      'PowerPointDocument': '\uEF72',
      'ExcelDocument': '\uEF73',
      'GroupedList': '\uEF74',
      'ClassroomLogo': '\uEF75',
      'Sections': '\uEF76',
      'EditPhoto': '\uEF77',
      'Starburst': '\uEF78',
      'ShareiOS': '\uEF79',
      'AirTickets': '\uEF7A',
      'PencilReply': '\uEF7B',
      'Tiles2': '\uEF7C',
      'SkypeCircleCheck': '\uEF7D',
      'SkypeCircleClock': '\uEF7E',
      'SkypeCircleMinus': '\uEF7F',
      'SkypeMessage': '\uEF83',
      'ClosedCaption': '\uEF84',
      'ATPLogo': '\uEF85',
      'OfficeFormsLogoInverse': '\uEF86',
      'RecycleBin': '\uEF87',
      'EmptyRecycleBin': '\uEF88',
      'Hide2': '\uEF89',
      'Breadcrumb': '\uEF8C',
      'BirthdayCake': '\uEF8D',
      'TimeEntry': '\uEF95',
      'CRMProcesses': '\uEFB1',
      'PageEdit': '\uEFB6',
      'PageArrowRight': '\uEFB8',
      'PageRemove': '\uEFBA',
      'Database': '\uEFC7',
      'DataManagementSettings': '\uEFC8',
      'CRMServices': '\uEFD2',
      'EditContact': '\uEFD3',
      'ConnectContacts': '\uEFD4',
      'AppIconDefaultAdd': '\uEFDA',
      'AppIconDefaultList': '\uEFDE',
      'ActivateOrders': '\uEFE0',
      'DeactivateOrders': '\uEFE1',
      'ProductCatalog': '\uEFE8',
      'ScatterChart': '\uEFEB',
      'AccountActivity': '\uEFF4',
      'DocumentManagement': '\uEFFC',
      'CRMReport': '\uEFFE',
      'KnowledgeArticle': '\uF000',
      'Relationship': '\uF003',
      'HomeVerify': '\uF00E',
      'ZipFolder': '\uF012',
      'SurveyQuestions': '\uF01B',
      'TextDocument': '\uF029',
      'TextDocumentShared': '\uF02B',
      'PageCheckedOut': '\uF02C',
      'PageShared': '\uF02D',
      'SaveAndClose': '\uF038',
      'Script': '\uF03A',
      'Archive': '\uF03F',
      'ActivityFeed': '\uF056',
      'Compare': '\uF057',
      'EventDate': '\uF059',
      'ArrowUpRight': '\uF069',
      'CaretRight': '\uF06B',
      'SetAction': '\uF071',
      'ChatBot': '\uF08B',
      'CaretSolidLeft': '\uF08D',
      'CaretSolidDown': '\uF08E',
      'CaretSolidRight': '\uF08F',
      'CaretSolidUp': '\uF090',
      'PowerAppsLogo': '\uF091',
      'PowerApps2Logo': '\uF092',
      'SearchIssue': '\uF09A',
      'SearchIssueMirrored': '\uF09B',
      'FabricAssetLibrary': '\uF09C',
      'FabricDataConnectionLibrary': '\uF09D',
      'FabricDocLibrary': '\uF09E',
      'FabricFormLibrary': '\uF09F',
      'FabricFormLibraryMirrored': '\uF0A0',
      'FabricReportLibrary': '\uF0A1',
      'FabricReportLibraryMirrored': '\uF0A2',
      'FabricPublicFolder': '\uF0A3',
      'FabricFolderSearch': '\uF0A4',
      'FabricMovetoFolder': '\uF0A5',
      'FabricUnsyncFolder': '\uF0A6',
      'FabricSyncFolder': '\uF0A7',
      'FabricOpenFolderHorizontal': '\uF0A8',
      'FabricFolder': '\uF0A9',
      'FabricFolderFill': '\uF0AA',
      'FabricNewFolder': '\uF0AB',
      'FabricPictureLibrary': '\uF0AC',
      'PhotoVideoMedia': '\uF0B1',
      'AddFavorite': '\uF0C8'
    }
  };

  registerIcons(subset, options);
}
