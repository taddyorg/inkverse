import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";

import { ComicSeriesScreenParams } from "@/app/screens/comicseries";
import { ComicIssueScreenParams } from "@/app/screens/comicissue";
import { CreatorScreenParams } from "@/app/screens/creator";
import { SettingsScreenParams } from "@/app/screens/settings";
import { ListScreenParams } from "@/app/screens/list";
import { ComicsListScreenParams } from "@/app/screens/comicslist";
import { BlogScreenParams } from "@/app/screens/blog";
import { ReportsScreenParams } from "@/app/screens/reports";
import { WrappedComicSeriesScreenParams } from "@/app/screens/wrapped-screens/wrappedcomicseries";
import { WrappedComicIssueScreenParams } from "@/app/screens/wrapped-screens/wrappedcomicissue";
import { WrappedCreatorScreenParams } from "@/app/screens/wrapped-screens/wrappedcreator";
import { WrappedListScreenParams } from "@/app/screens/wrapped-screens/wrappedlist";
import { WrappedTaggedScreenParams } from "@/app/screens/wrapped-screens/wrappedtagged";

export const HOME_TAB = "HomeTab";
export const SEARCH_TAB = "SearchTab";
export const PROFILE_TAB = "ProfileTab";
export const HOME_SCREEN = "HomeScreen";
export const SEARCH_SCREEN = "SearchScreen";
export const PROFILE_SCREEN = "ProfileScreen";
export const COMICSERIES_SCREEN = "ComicSeriesScreen";
export const COMICISSUE_SCREEN = "ComicIssueScreen";
export const CREATOR_SCREEN = "CreatorScreen";
export const SETTINGS_SCREEN = "SettingsScreen";
export const LIST_SCREEN = "ListScreen";
export const COMICS_LIST_SCREEN = "ComicsListScreen";
export const BLOG_SCREEN = "BlogScreen";
export const REPORTS_SCREEN = "ReportsScreen";
export const MAIN_SCREEN = "MainScreen";
export const WRAPPED_COMICSERIES_SCREEN = "WrappedComicSeriesScreen";
export const WRAPPED_COMICISSUE_SCREEN = "WrappedComicIssueScreen";
export const WRAPPED_CREATOR_SCREEN = "WrappedCreatorScreen";
export const WRAPPED_LIST_SCREEN = "WrappedListScreen";
export const WRAPPED_TAGGED_SCREEN = "WrappedTaggedScreen";

export type RootStackParamList = {
  [HOME_TAB]: undefined;
  [SEARCH_TAB]: undefined;
  [PROFILE_TAB]: undefined;
  [HOME_SCREEN]: undefined;
  [COMICSERIES_SCREEN]: ComicSeriesScreenParams;
  [COMICISSUE_SCREEN]: ComicIssueScreenParams;
  [CREATOR_SCREEN]: CreatorScreenParams;
  [SEARCH_SCREEN]: undefined;
  [PROFILE_SCREEN]: undefined;
  [SETTINGS_SCREEN]: SettingsScreenParams;
  [LIST_SCREEN]: ListScreenParams;
  [COMICS_LIST_SCREEN]: ComicsListScreenParams;
  [BLOG_SCREEN]: BlogScreenParams;
  [REPORTS_SCREEN]: ReportsScreenParams;
  [MAIN_SCREEN]: undefined;
  [WRAPPED_COMICSERIES_SCREEN]: WrappedComicSeriesScreenParams;
  [WRAPPED_COMICISSUE_SCREEN]: WrappedComicIssueScreenParams;
  [WRAPPED_CREATOR_SCREEN]: WrappedCreatorScreenParams;
  [WRAPPED_LIST_SCREEN]: WrappedListScreenParams;
  [WRAPPED_TAGGED_SCREEN]: WrappedTaggedScreenParams;
};

interface ResetNavigationToContentScreenParams {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  rootTab?: keyof RootStackParamList;
  rootScreen?: keyof RootStackParamList;
  parentScreenName?: keyof RootStackParamList;
  parentScreenParams?: object;
  screenName: keyof RootStackParamList;
  screenParams: object;
}

// Reusable navigation utility for wrapped screens
export const navigateToDeepLinkAndResetNavigation = ({
  navigation,
  rootTab = HOME_TAB,
  rootScreen = HOME_SCREEN,
  parentScreenName,
  parentScreenParams,
  screenName,
  screenParams
}: ResetNavigationToContentScreenParams) => {
  navigation.dispatch(
    CommonActions.reset({
      index: 1, // Set index to 1 to include HomeScreen in history
      routes: [
        { 
          name: MAIN_SCREEN,
          state: {
            routes: [
              {
                name: rootTab,
                state: {
                  index: parentScreenName ? 2 : 1, // Set index to 1 to include HomeScreen in history
                  routes: [
                    { name: rootScreen }, // Add Home Screen as base for history
                    ...(parentScreenName && parentScreenParams ? [{
                      name: parentScreenName,
                      params: parentScreenParams
                    }] : []),
                    {
                      name: screenName,
                      params: screenParams
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    })
  );
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 