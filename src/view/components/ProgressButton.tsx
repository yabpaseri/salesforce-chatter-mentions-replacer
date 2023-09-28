import { CircularProgress, styled } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { ComponentProps, memo } from 'react';

type TProps = ComponentProps<typeof Button> & {
	progress?: boolean;
	progressProps?: ComponentProps<typeof CircularProgress>;
};

export const ProgressButton = memo<TProps>(({ progress, progressProps, ...props }) => {
	return (
		<Box display="flex" position="relative" justifyContent="center" alignItems="center">
			<Button {...props} />
			{progress && <CenteringCircularProgress {...progressProps} />}
		</Box>
	);
});
ProgressButton.displayName = 'ProgressButton';

const CenteringCircularProgress = styled(CircularProgress)({
	position: 'absolute',
});
