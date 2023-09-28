import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import { i18n } from '~/i18n';

export const OptionHeader = memo(() => {
	return (
		<AppBar position="static">
			<Toolbar variant="dense">
				<Typography variant="h6" component="div" color="inherit">
					{i18n('OPTIONS')}
				</Typography>
			</Toolbar>
		</AppBar>
	);
});
OptionHeader.displayName = 'OptionHeader';
