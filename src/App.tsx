import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from './theme';
import { AliasProvider } from './core/context/AliasContext';
import { AppProvider, useApp } from './core/context/AppContext';
import { MenuScreen } from './screens/MenuScreen';
import { PlayScreen } from './screens/PlayScreen';
import { ResultScreen } from './screens/ResultScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ProgressProvider } from './core/context/ProgressContext';

const ScreenManager = () => {
  const { screen } = useApp();
  if (screen === 'PLAY') return <PlayScreen />;
  if (screen === 'RESULTS') return <ResultScreen />;
  if (screen === 'PROGRESS') return <ProgressScreen />;
  return <MenuScreen />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AliasProvider>
          <ProgressProvider>
            <div className="min-h-screen flex flex-col items-center justify-center font-sans">
              <ScreenManager />
            </div>
          </ProgressProvider>
        </AliasProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
