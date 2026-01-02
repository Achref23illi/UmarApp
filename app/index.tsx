import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to welcome screen on app start
  // TODO: Check if user is authenticated and redirect to (tabs) if logged in
  return <Redirect href="/welcome" />;
}
