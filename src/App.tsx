import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme';
import { AliasProvider } from './core/context/AliasContext';
import { AppProvider, useApp } from './core/context/AppContext';
import { MenuScreen } from './screens/MenuScreen';
import { PlayScreen } from './screens/PlayScreen';
import { ResultScreen } from './screens/ResultScreen';

const ScreenManager = () => {
  const { screen } = useApp();
  if (screen === 'PLAY') return <PlayScreen />;
  if (screen === 'RESULTS') return <ResultScreen />;
  return <MenuScreen />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AliasProvider>
          <div className="min-h-screen flex flex-col items-center justify-center font-sans">
            <ScreenManager />
          </div>
        </AliasProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
