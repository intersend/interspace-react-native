import { Redirect } from 'expo-router';

// Redirect to the Apps tab as the default screen
export default function Index() {
  return <Redirect href="/(tabs)/apps" />;
}
