import { useEffect, useRef } from 'react';

/**
 * 値をref化する。stateなどで変わってほしくない値に使えないかな...
 */
export const useSyncRef = <T,>(value: T) => {
	const ref = useRef(value);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref;
};
