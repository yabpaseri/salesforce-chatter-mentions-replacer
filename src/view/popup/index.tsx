import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';

(function main() {
	const container = document.getElementById('container');
	if (!container) throw new Error('$(#container) not found.');
	const root = createRoot(container);

	const params = new URLSearchParams(location.search);
	const props = {
		_env: params.get('env') ?? void 0,
		_key: params.get('key') ?? void 0,
		_name: params.get('name') ?? void 0,
		_sfid: params.get('sfid') ?? void 0,
	};

	root.render(
		<Fragment>
			<CssBaseline />
			<Box padding="20px 5px 10px" minWidth="450px">
				<Popup {...props} />
			</Box>
		</Fragment>,
	);
})();
