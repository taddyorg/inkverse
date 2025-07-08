import * as React from 'react';
import { Platform, useColorScheme, ColorSchemeName } from 'react-native';
import { NavigationContainer, ParamListBase, RouteProp, LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native'
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

import config from '@/config';
import { HomeScreen } from './home';
import { SearchScreen } from './search'
import { ProfileScreen } from './profile';
import { ComicSeriesScreen } from './comicseries';
import { ComicIssueScreen } from './comicissue';
import { CreatorScreen } from './creator';
import { SettingsScreen } from './settings';
import { ListScreen } from './list';
import { ComicsListScreen } from './comicslist';
import { BlogScreen } from './blog';
import { ReportsScreen } from './reports';
import { EditProfileScreen } from './profile-edit/index';
import { EditUsernameScreen } from './profile-edit/edit-username';
import { EditAgeScreen } from './profile-edit/edit-age';
import { EditEmailScreen } from './profile-edit/edit-email';
import { EditPatreonScreen } from './profile-edit/edit-patreon';
import { EditBlueskyScreen } from './profile-edit/edit-bluesky';

import { SignupScreen } from './signup';
import { SignupEmailScreen } from './signup/signup-email';
import { SignupResetScreen } from './signup/signup-reset';
import { SignupUsernameScreen } from './signup/signup-username';
import { SignupAgeScreen } from './signup/signup-age';
import { SignupPatreonScreen } from './signup/signup-patreon';
import { SignupBlueskyScreen } from './signup/signup-bluesky';
import { SignupCompleteScreen } from './signup/signup-complete';
import { SignupNotificationsScreen } from './signup/signup-notifications';
import { AppLoaderProvider } from '../components/providers/AppLoaderProvider';
import { AuthRefreshProvider } from '../components/providers/AuthRefreshProvider';
import { WrappedComicSeriesScreen } from './wrapped-screens/wrappedcomicseries';
import { WrappedComicIssueScreen } from './wrapped-screens/wrappedcomicissue';
import { WrappedCreatorScreen } from './wrapped-screens/wrappedcreator';
import { WrappedListScreen } from './wrapped-screens/wrappedlist';
import { WrappedTaggedScreen } from './wrapped-screens/wrappedtagged';
import { WrappedProfileScreen } from './wrapped-screens/wrappedprofile';
import { WrappedHostingProviderScreen } from './wrapped-screens/wrappedhostingprovider';

import { 
  HOME_TAB, 
  SEARCH_TAB, 
  PROFILE_TAB, 
  HOME_SCREEN, 
  SEARCH_SCREEN, 
  PROFILE_SCREEN, 
  COMICSERIES_SCREEN,
  WRAPPED_COMICSERIES_SCREEN,
  WRAPPED_COMICISSUE_SCREEN,
  WRAPPED_CREATOR_SCREEN,
  WRAPPED_LIST_SCREEN,
  WRAPPED_TAGGED_SCREEN,
  WRAPPED_PROFILE_SCREEN,
  WRAPPED_HOSTING_PROVIDER_SCREEN,
  COMICISSUE_SCREEN, 
  CREATOR_SCREEN, 
  SETTINGS_SCREEN,
  LIST_SCREEN, 
  COMICS_LIST_SCREEN, 
  BLOG_SCREEN, 
  REPORTS_SCREEN, 
  MAIN_SCREEN,
  SIGNUP_SCREEN,
  SIGNUP_MAIN_SCREEN,
  SIGNUP_EMAIL_SCREEN,
  SIGNUP_RESET_SCREEN,
  SIGNUP_USERNAME_SCREEN,
  SIGNUP_AGE_SCREEN,
  SIGNUP_PATREON_SCREEN,
  SIGNUP_BLUESKY_SCREEN,
  SIGNUP_COMPLETE_SCREEN,
  SIGNUP_NOTIFICATIONS_SCREEN,
  EDIT_PROFILE_SCREEN,
  EDIT_USERNAME_SCREEN,
  EDIT_AGE_SCREEN,
  EDIT_EMAIL_SCREEN,
  EDIT_PATREON_SCREEN,
  EDIT_BLUESKY_SCREEN,
  RootStackParamList,
} from '../../constants/Navigation';

Sentry.init({
  dsn: config.SENTRY_URL,
});

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const comicSeriesScreenConfig = {
  name: COMICSERIES_SCREEN as keyof RootStackParamList,
  component: ComicSeriesScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const comicIssueScreenConfig = {
  name: COMICISSUE_SCREEN as keyof RootStackParamList,
  component: ComicIssueScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const creatorScreenConfig = {
  name: CREATOR_SCREEN as keyof RootStackParamList,
  component: CreatorScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const settingsScreenConfig = {
  name: SETTINGS_SCREEN as keyof RootStackParamList,
  component: SettingsScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const listScreenConfig = {
  name: LIST_SCREEN as keyof RootStackParamList,
  component: ListScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const comicsListScreenConfig = {
  name: COMICS_LIST_SCREEN as keyof RootStackParamList,
  component: ComicsListScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const profileScreenConfig = {
  name: PROFILE_SCREEN as keyof RootStackParamList,
  component: ProfileScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const editProfileScreenConfig = {
  name: EDIT_PROFILE_SCREEN as keyof RootStackParamList,
  component: EditProfileScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const editUsernameScreenConfig = {
  name: EDIT_USERNAME_SCREEN as keyof RootStackParamList,
  component: EditUsernameScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const editAgeScreenConfig = {
  name: EDIT_AGE_SCREEN as keyof RootStackParamList,
  component: EditAgeScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const editEmailScreenConfig = {
  name: EDIT_EMAIL_SCREEN as keyof RootStackParamList,
  component: EditEmailScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const editPatreonScreenConfig = {
  name: EDIT_PATREON_SCREEN as keyof RootStackParamList,
  component: EditPatreonScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const editBlueskyScreenConfig = {
  name: EDIT_BLUESKY_SCREEN as keyof RootStackParamList,
  component: EditBlueskyScreen,
  options: {
    title: '',
    headerShown: false,
  }
};

const stackScreenOptions = {
  ...Platform.select({
    android: {
      animation: 'slide_from_right' as const,
      // Remove transparentModal as it interferes with swipe gestures
      // presentation: 'transparentModal' as const,
      // Android-specific gesture configuration
      freezeOnBlur: true, // Improves performance and gesture handling
    },
    ios: {
      // iOS keeps default behavior
    }
  }),
  // Enable gestures with proper configuration
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  // Adjust gesture response distance based on platform
  gestureResponseDistance: Platform.select({
    android: {
      start: 40, // Slightly lower than iOS to account for navigation bar
      end: 200, // Allow gestures from a wider area
    },
    ios: {
      start: 50, // Increase from default 25 for better edge swipe detection
    },
  }),
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen 
        name={HOME_SCREEN} 
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false
        }}
      />
      <Stack.Screen {...comicSeriesScreenConfig} />
      <Stack.Screen {...comicIssueScreenConfig} />
      <Stack.Screen {...creatorScreenConfig} />
      <Stack.Screen {...listScreenConfig} />
      <Stack.Screen {...comicsListScreenConfig} />
      <Stack.Screen {...profileScreenConfig} />
      <Stack.Screen {...editPatreonScreenConfig} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen 
        name={SEARCH_SCREEN} 
        component={SearchScreen}
        options={{
          title: 'Search',
          headerShown: false
        }}
      />
      <Stack.Screen {...comicSeriesScreenConfig} />
      <Stack.Screen {...comicIssueScreenConfig} />
      <Stack.Screen {...creatorScreenConfig} />
      <Stack.Screen {...listScreenConfig} />
      <Stack.Screen {...comicsListScreenConfig} />
      <Stack.Screen {...profileScreenConfig} />
      <Stack.Screen {...editPatreonScreenConfig} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen 
        name={PROFILE_SCREEN} 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerShown: false
        }}
      />
      <Stack.Screen {...comicSeriesScreenConfig} />
      <Stack.Screen {...comicIssueScreenConfig} />
      <Stack.Screen {...creatorScreenConfig} />
      <Stack.Screen {...listScreenConfig} />
      <Stack.Screen {...settingsScreenConfig} />
      <Stack.Screen {...editProfileScreenConfig} />
      <Stack.Screen {...editUsernameScreenConfig} />
      <Stack.Screen {...editAgeScreenConfig} />
      <Stack.Screen {...editEmailScreenConfig} />
      <Stack.Screen {...editPatreonScreenConfig} />
      <Stack.Screen {...editBlueskyScreenConfig} />
    </Stack.Navigator>
  );
}

const tabBarStyleOptions = (colorScheme: ColorSchemeName) => {
  const navBackground = Colors[colorScheme ?? 'light'].background;
  const tabBarActiveTintColor = Colors[colorScheme ?? 'light'].text;

  return ({ route }: { route: RouteProp<ParamListBase, string> }) => {
    const isComicIssueScreen = getFocusedRouteNameFromRoute(route) === COMICISSUE_SCREEN;
    const tabBarStyleDisplay = isComicIssueScreen 
      ? { display: 'none' as const }
      : { display: 'flex' as const };
    
    return {
      headerShown: false,
      tabBarStyle: {
        backgroundColor: navBackground,
        borderTopWidth: 0,
        ...tabBarStyleDisplay,
        tabBarVisibilityAnimationConfig: {
          animation: 'slide_from_bottom'
        }
      },
      tabBarActiveTintColor,
      ...Platform.select({
        ios: {
          tabBarLabelStyle: {
            fontSize: 11
          },
          tabBarIconStyle: {
            marginTop: 5,
            marginBottom: 3
          }
        },
      })
    };
  };
};

const iconSize = 22;

function getIconName(name: string) {
  switch (name) {
      case HOME_TAB:
          return "home";
      case SEARCH_TAB:
          return "search";
      case PROFILE_TAB:
          return "user-alt";
      default:
          throw new Error("Invalid tab name");
  }
}

function RootStack() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator 
      initialRouteName={HOME_TAB}
      screenOptions={tabBarStyleOptions(colorScheme)}
    >
      <Tab.Screen 
        name={HOME_TAB} 
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
              <FontAwesome5 name={getIconName(HOME_TAB)} size={iconSize} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={SEARCH_TAB} 
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name={getIconName(SEARCH_TAB)} size={iconSize} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name={PROFILE_TAB} 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name={getIconName(PROFILE_TAB)} size={iconSize} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const navigationRef = React.useRef<NavigationContainerRef<ReactNavigation.RootParamList>>(null);

  const linking: LinkingOptions<ReactNavigation.RootParamList> = {
    prefixes: ['https://inkverse.co'],
    config: {
      initialRouteName: MAIN_SCREEN,
      screens: {
        [BLOG_SCREEN]: {
          path: 'blog',
          alias: [
            {
              path: 'blog/:slug',
            },
            {
              path: 'terms-of-service',
            },
            {
              path: 'terms-of-service/:slug',
            },
            {
              path: 'open-source',
            },
            {
              path: 'open-source/:slug',
            },
            {
              path: 'updates',
            },
            {
              path: 'updates/:slug',
            },
            {
              path: 'brand-kit',
            },
          ],
        },
        [WRAPPED_COMICSERIES_SCREEN]: 'comics/:shortUrl',
        [WRAPPED_COMICISSUE_SCREEN]: 'comics/:shortUrl/:episodeId',
        [WRAPPED_CREATOR_SCREEN]: 'creators/:shortUrl',
        [WRAPPED_LIST_SCREEN]: 'lists/:idAndName',
        [WRAPPED_TAGGED_SCREEN]: 'tagged/:tag',
        [WRAPPED_PROFILE_SCREEN]: ':username',
        [WRAPPED_HOSTING_PROVIDER_SCREEN]: 'hosting-provider/:uuid',
        [SIGNUP_SCREEN]: {
          screens: {
            [SIGNUP_RESET_SCREEN]: 'reset',
          },
        },
      },
    },
  };

  const modalScreenOptions = {
    presentation: 'modal' as const,
    animation: 'slide_from_bottom' as const,
    gestureEnabled: true,
    gestureDirection: 'vertical' as const,
    fullScreenGestureEnabled: true,
    contentStyle: { backgroundColor: 'white' },
    ...Platform.select({
      android: {
        // Android-specific gesture configuration for modals
        gestureResponseDistance: {
          top: 135, // Default modal gesture distance
        },
      },
    }),
  }

  const modalScreenOptionsCannotClose = {
    presentation: 'modal' as const,
    animation: 'slide_from_bottom' as const,
    contentStyle: { backgroundColor: 'white' },
    gestureEnabled: false,
    fullScreenGestureEnabled: false,
    ...Platform.select({
      android: {
        // Ensure gestures are fully disabled on Android too
        gestureResponseDistance: {
          top: 0,
          bottom: 0,
          start: 0,
          end: 0,
        },
      },
    }),
  }

  // Create the signup stack navigator
  const SignupStack = createNativeStackNavigator();
  
  function SignupNavigator() {
    return (
      <SignupStack.Navigator
        initialRouteName={SIGNUP_MAIN_SCREEN}
        screenOptions={{
          headerShown: false,
          ...stackScreenOptions, // Apply the same gesture configurations
        }}
      >
        <SignupStack.Screen 
          name={SIGNUP_MAIN_SCREEN} 
          component={SignupScreen}
        />
        <SignupStack.Screen 
          name={SIGNUP_EMAIL_SCREEN} 
          component={SignupEmailScreen}
        />
        <SignupStack.Screen 
          name={SIGNUP_RESET_SCREEN} 
          component={SignupResetScreen}
        />
        <SignupStack.Screen 
          name={SIGNUP_USERNAME_SCREEN} 
          component={SignupUsernameScreen}
        />
        <SignupStack.Screen 
          name={SIGNUP_AGE_SCREEN} 
          component={SignupAgeScreen}
        />
        <SignupStack.Screen 
          name={SIGNUP_NOTIFICATIONS_SCREEN} 
          component={SignupNotificationsScreen}
        />
        <SignupStack.Screen 
          name={SIGNUP_PATREON_SCREEN} 
          component={SignupPatreonScreen}
        />
        <SignupStack.Screen 
          name={SIGNUP_BLUESKY_SCREEN} 
          component={SignupBlueskyScreen}
        />
        <SignupStack.Screen 
          name={SIGNUP_COMPLETE_SCREEN} 
          component={SignupCompleteScreen}
        />
      </SignupStack.Navigator>
    );
  }

  return (
    <SafeAreaProvider>
      <AppLoaderProvider>
        <AuthRefreshProvider>
          <NavigationContainer 
            ref={navigationRef}
            linking={linking}
          >
            <PostHogProvider 
              apiKey={config.POST_HOG_INFO.API_KEY}
              options={{
                host: config.POST_HOG_INFO.HOST_URL,
                // enableSessionReplay: true,
                // sessionReplayConfig: {
                //   maskAllTextInputs: true,
                //   maskAllImages: true,
                //   captureLog: true,
                //   captureNetworkTelemetry: true,
                //   androidDebouncerDelayMs: 500,
                //   iOSdebouncerDelayMs: 1000,
                // },
              }}
            >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen 
              name={MAIN_SCREEN} 
              component={RootStack} 
            />
            <Stack.Screen 
              name={BLOG_SCREEN} 
              component={BlogScreen}
              options={modalScreenOptions}
            />            
            <Stack.Screen 
              name={REPORTS_SCREEN} 
              component={ReportsScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name={WRAPPED_COMICSERIES_SCREEN} 
              component={WrappedComicSeriesScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name={WRAPPED_COMICISSUE_SCREEN} 
              component={WrappedComicIssueScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name={WRAPPED_CREATOR_SCREEN} 
              component={WrappedCreatorScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name={WRAPPED_LIST_SCREEN} 
              component={WrappedListScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name={WRAPPED_TAGGED_SCREEN} 
              component={WrappedTaggedScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name={WRAPPED_PROFILE_SCREEN} 
              component={WrappedProfileScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name={WRAPPED_HOSTING_PROVIDER_SCREEN} 
              component={WrappedHostingProviderScreen}
              options={modalScreenOptions}
            />
            <Stack.Screen 
              name={SIGNUP_SCREEN} 
              component={SignupNavigator}
              options={modalScreenOptionsCannotClose}
            />
          </Stack.Navigator>
        </PostHogProvider>
      </NavigationContainer>
      </AuthRefreshProvider>
    </AppLoaderProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);