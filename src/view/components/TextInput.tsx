import TextField from '@mui/material/TextField';
import { ChangeEventHandler, ComponentProps, memo, useCallback } from 'react';

type TProps = Omit<ComponentProps<typeof TextField>, 'value' | 'onChange'> & {
	value: string;
	onChange: (value: string) => void;
};

/**
 * valueとonChangeの引数をstringに固定したTextField。memo化済
 */
export const TextInput = memo<TProps>(({ onChange, ...props }) => {
	const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((ev) => onChange(ev.target.value), [onChange]);
	return <TextField onChange={handleChange} {...props} />;
});
TextInput.displayName = 'TextInput';
