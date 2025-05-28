import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/redux/store';
import RootContainer from './src/components/RootContainer';
import { Text, TextInput } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import i18n from './src/services/i18n';
import './src/services/i18n';

// Disable font scaling for Text and TextInput
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.allowFontScaling = false;

(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.allowFontScaling = false;

// Custom error boundary hook to handle errors in functional components
const useErrorBoundary = () => {
  const [hasError, setHasError] = useState(false);

  const handleError = (error: any, info: any) => {
    setHasError(true);
    console.error("App Error: ", error, info); // Log error to an external service (e.g., Firebase)
  };

  const ErrorFallback = () => {
    return <Text>Something went wrong. Please try again later.</Text>;
  };

  return { hasError, handleError, ErrorFallback };
};

const App = () => {
  const { hasError, handleError, ErrorFallback } = useErrorBoundary();

  useEffect(() => {
    // Splash screen hide after a delay of 1000ms
    const splashTimeout = setTimeout(() => {
      SplashScreen.hide();
    }, 1000);

    // Cleanup timeout on component unmount
    return () => clearTimeout(splashTimeout);
  }, []);

  if (hasError) {
    return <ErrorFallback />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RootContainer />
      </PersistGate>
    </Provider>
  );
};

export default App;
