import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import { SnackbarProvider } from 'notistack';
import { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { OptionContent } from './OptionContent';
import { OptionHeader } from './OptionHeader';

(function main() {
	const container = document.getElementById('container');
	if (!container) throw new Error('$(#container) not found.');
	const root = createRoot(container);

	root.render(
		<Fragment>
			<CssBaseline />
			<SnackbarProvider>
				<Stack direction="column" height="100vh" width="100vw">
					<OptionHeader />
					<OptionContent />
				</Stack>
			</SnackbarProvider>
		</Fragment>,
	);
})();
