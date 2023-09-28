import { Fragment, FunctionComponent, createRef, useCallback, useState } from 'react';
import { MentionDao } from '~/dao';
import { i18n } from '~/i18n';
import { Mention } from '~/types/mention';
import { MentionUtil } from '~/util';
import { BackdropMessage } from '../components/BackdropMessage';
import { useDidMountEffect } from '../hooks/useDidMountEffect';
import { Register } from '../register/Register';

type TProps = {
	_env?: string;
	_key?: string;
	_name?: string;
	_sfid?: string;
};
export const Popup: FunctionComponent<TProps> = ({ _env, _key, _name, _sfid }) => {
	const [successMessage, setSuccessMessage] = useState<string>();
	const registerRef = createRef<Register>();
	useDidMountEffect(() => {
		registerRef.current?.reset({ env: _env, key: _key, name: _name, sfid: _sfid });
	});

	const handleSave = useCallback(async (mention: Mention) => {
		const data = await MentionDao.readAsLenient();
		if (MentionUtil.exists(data, mention)) {
			throw new Error(i18n('ALREADY_EXIST_ENV_KEY'));
		}
		data.push(mention);
		await MentionDao.write(data);
		setSuccessMessage(i18n('ADDED'));
		setTimeout(window.close.bind(window), 2000);
	}, []);

	return (
		<Fragment>
			<Register ref={registerRef} onSave={handleSave} />
			<BackdropMessage message={successMessage} />
		</Fragment>
	);
};
