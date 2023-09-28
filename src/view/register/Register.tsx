import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Component, ReactNode, memo } from 'react';
import { i18n } from '~/i18n';
import { Mention } from '~/types/mention';
import { ProgressButton } from '../components/ProgressButton';
import { TextInput } from '../components/TextInput';

type Status = 'EDITING' | 'SAVING' | 'SAVED';
type TProps = {
	onSave?: (mention: Mention) => Promise<void>;
};
type TState = {
	env?: string;
	key?: string;
	name?: string;
	sfid?: string;
	status: Status;
	error?: string;
};

export class Register extends Component<TProps, TState> {
	constructor(props: TProps) {
		super(props);
		this.state = { status: 'EDITING' };
		this.save = this.save.bind(this);
	}

	reset(value: Pick<TState, 'env' | 'key' | 'name' | 'sfid'>) {
		this.setState({ env: value.env, key: value.key, name: value.name, sfid: value.sfid });
	}
	error(error: string) {
		this.setState({ error });
	}

	#handleEnvChange = this.#handleChange.bind(this, 'env');
	#handleKeyChange = this.#handleChange.bind(this, 'key');
	#handleNameChange = this.#handleChange.bind(this, 'name');
	#handleSfidChange = this.#handleChange.bind(this, 'sfid');
	#handleChange(key: string, value: string) {
		const state: Partial<TState> = { [key]: value, error: void 0 };
		this.setState(state as TState);
	}

	get #readyToSave(): boolean {
		const { env, key, name, sfid, error, status } = this.state;
		return status === 'EDITING' && error == null && [env, key, name, sfid].every((v) => v != null && v.length > 0);
	}
	async save() {
		if (!this.#readyToSave || !this.props.onSave) return;
		await new Promise<void>((ok) => this.setState({ status: 'SAVING' }, ok));
		const { env, key, name, sfid } = this.state;
		const mention: Mention = { id: crypto.randomUUID(), env: env!, key: key!, name: name!, sfid: sfid! };
		try {
			await this.props.onSave(mention);
			this.setState({ status: 'SAVED' });
		} catch (e) {
			console.log(e);
			let error = 'error occured';
			if (typeof e === 'string') {
				error = e;
			} else if (e instanceof Error) {
				error = e.message;
			}
			this.setState({ status: 'EDITING', error });
		}
	}

	override render(): ReactNode {
		const { env, key, name, sfid, error, status } = this.state;
		return (
			<Stack direction="column" spacing={1.5}>
				<TextInput
					fullWidth
					required
					label={i18n('TYPES_MENTION_ENV')}
					value={env ?? ''}
					onChange={this.#handleEnvChange}
					error={env === ''} // undefinedの時は空でもエラーには見せない
					disabled={status !== 'EDITING'}
					InputLabelProps={{ shrink: true }}
				/>
				<TextInput
					fullWidth
					required
					label={i18n('TYPES_MENTION_KEY')}
					value={key ?? ''}
					onChange={this.#handleKeyChange}
					error={key === ''} // undefinedの時は空でもエラーには見せない
					disabled={status !== 'EDITING'}
					InputLabelProps={{ shrink: true }}
				/>
				<TextInput
					fullWidth
					required
					label={i18n('TYPES_MENTION_NAME')}
					value={name ?? ''}
					onChange={this.#handleNameChange}
					error={name === ''} // undefinedの時は空でもエラーには見せない
					disabled={status !== 'EDITING'}
					InputLabelProps={{ shrink: true }}
				/>
				<TextInput
					fullWidth
					required
					label={i18n('TYPES_MENTION_SFID')}
					value={sfid ?? ''}
					onChange={this.#handleSfidChange}
					error={sfid === ''} // undefinedの時は空でもエラーには見せない
					disabled={status !== 'EDITING'}
					InputLabelProps={{ shrink: true }}
				/>
				<Stack direction="row" spacing={1}>
					<ErrorText error={error} />
					<ProgressButton
						tabIndex={-1}
						onClick={this.save}
						disabled={!this.#readyToSave}
						variant="contained"
						progress={status === 'SAVING'}
						progressProps={{ size: '28px' }}
					>
						{i18n('ADD')}
					</ProgressButton>
				</Stack>
			</Stack>
		);
	}
}

// エラーメッセージ
type TErrorTextProps = { error?: string };
const ErrorText = memo<TErrorTextProps>(({ error }) => {
	return (
		<Box flex="1 1 0" position="relative">
			{error && (
				<Typography color="red" variant="caption" position="absolute" right="0" bottom="0">
					{error}
				</Typography>
			)}
		</Box>
	);
});
ErrorText.displayName = 'ErrorText';
