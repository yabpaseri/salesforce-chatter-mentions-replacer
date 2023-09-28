import { styled } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { ComponentProps, memo } from 'react';

type TProps = Omit<ComponentProps<typeof Typography>, 'children'> & {
	message?: string;
};

export const BackdropMessage = memo<TProps>(({ message, ...props }) => {
	return (
		<Backdrop open={message != null}>
			<Card>
				<SCardContent>
					<Typography {...props}>{message}</Typography>
				</SCardContent>
			</Card>
		</Backdrop>
	);
});
BackdropMessage.displayName = 'BackdropMessage';

const SCardContent = styled(CardContent)({
	'&:last-child': {
		paddingBottom: '16px', // last-childは24pxになっているので、打消し
	},
});
