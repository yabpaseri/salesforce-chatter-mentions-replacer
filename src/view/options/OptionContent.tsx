import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Box from '@mui/material/Box';
import {
	DataGrid,
	GridActionsCellItem,
	GridActionsCellItemProps,
	GridColDef,
	GridLocaleText,
	GridRowId,
	GridRowModes,
	GridRowModesModel,
	GridRowParams,
	useGridApiRef,
} from '@mui/x-data-grid';
import { GridApiCommunity } from '@mui/x-data-grid/internals';
import { GridRowModesModelProps } from '@mui/x-data-grid/models/api/gridEditingApi';
import { enqueueSnackbar } from 'notistack';
import { Component, FunctionComponent, MutableRefObject, ReactElement, ReactNode } from 'react';
import { MentionDao } from '~/dao';
import { i18n } from '~/i18n';
import { Mention } from '~/types/mention';
import { MentionUtil } from '~/util';

export const OptionContent: FunctionComponent = () => {
	const dataGridApi = useGridApiRef(); // コレが欲しいので、仕方なく関数コンポーネントを挟む
	return <OptionContentImpl dataGridApi={dataGridApi} />;
};

type TProps = {
	dataGridApi: MutableRefObject<GridApiCommunity>;
};
type TState = {
	mentions?: Mention[];
	rowModesModel: GridRowModesModel;
};
class OptionContentImpl extends Component<TProps, TState> {
	constructor(props: TProps) {
		super(props);
		this.state = { rowModesModel: {} };
		this.writeMentions = this.writeMentions.bind(this);
		this.readMentions = this.readMentions.bind(this);
		this.handleSyncStorageChange = this.handleSyncStorageChange.bind(this);
		this.handleEditClick = this.handleEditClick.bind(this);
		this.handleDeleteClick = this.handleDeleteClick.bind(this);
		this.handleCancelClick = this.handleCancelClick.bind(this);
		this.handleSaveClick = this.handleSaveClick.bind(this);
		this.handleRowModesModelChange = this.handleRowModesModelChange.bind(this);
		this.processRowUpdate = this.processRowUpdate.bind(this);
		this.actionsRender = this.actionsRender.bind(this);
	}

	#saveTimeout: NodeJS.Timeout | undefined;
	writeMentions() {
		const mentions: Mention[] = JSON.parse(JSON.stringify(this.state.mentions));
		if (this.#saveTimeout) clearTimeout(this.#saveTimeout);
		this.#saveTimeout = setTimeout(() => {
			this.#saveTimeout = void 0;
			MentionDao.write(mentions).then(() => {
				enqueueSnackbar({ variant: 'success', message: i18n('SAVED') });
			});
		}, 250);
	}

	/** chrome.storage.syncのデータを読んで、stateに反映する */
	async readMentions() {
		// まずは全ての編集状態を止める必要がある。編集中だと、値が反映できない
		if (this.state.mentions) {
			const api = this.props.dataGridApi.current;
			for (const id of this.state.mentions.map((m) => m.id)) {
				if (api.getRowMode(id) === 'edit') api.stopRowEditMode({ id, ignoreModifications: true });
			}
		}
		// 最新の値を取得して反映する
		const mentions = await MentionDao.readAsLenient();
		const changed = this.state.mentions != null && JSON.stringify(this.state.mentions) !== JSON.stringify(mentions);
		if (changed) {
			// 編集中だと値が反映できないので、編集状態を解除
			const api = this.props.dataGridApi.current;
			for (const id of this.state.mentions!.map((m) => m.id)) {
				if (api.getRowMode(id) === 'edit') api.stopRowEditMode({ id, ignoreModifications: true });
			}
		}
		this.setState({ mentions }, () => {
			if (changed) enqueueSnackbar({ variant: 'info', message: i18n('MENTION_RELOADED') });
		});
	}
	handleSyncStorageChange(changes: Record<string, unknown>): void {
		if (MentionDao.KEY in changes) this.readMentions();
	}

	handleEditClick(id: GridRowId) {
		const next = { ...this.state.rowModesModel, [id]: { mode: GridRowModes.Edit } };
		this.setState({ rowModesModel: next });
	}
	handleDeleteClick(id: GridRowId) {
		const next = this.state.mentions?.filter((m) => m.id !== id);
		this.setState({ mentions: next }, this.writeMentions);
	}
	handleCancelClick(id: GridRowId) {
		const next = { ...this.state.rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true } };
		this.setState({ rowModesModel: next });
	}
	handleSaveClick(id: GridRowId) {
		const next = { ...this.state.rowModesModel, [id]: { mode: GridRowModes.View } };
		this.setState({ rowModesModel: next });
	}

	handleRowModesModelChange(rowModesModel: GridRowModesModel) {
		this.setState({ rowModesModel });
	}
	processRowUpdate(newRow: Mention, oldRow: Mention) {
		const others = this.state.mentions?.filter((m) => m.id !== newRow.id);
		const canceler = () => {
			const props: GridRowModesModelProps = { mode: GridRowModes.Edit, fieldToFocus: 'env' };
			const next = { ...this.state.rowModesModel, [newRow.id]: props };
			setTimeout(() => this.setState({ rowModesModel: next }), 0);
		};
		if (MentionUtil.someEmpty(newRow)) {
			enqueueSnackbar({ variant: 'error', message: i18n('NOT_ALLOW_BLANK') });
			canceler();
			return MentionUtil.fillEmpty(newRow, oldRow);
		}
		if (others && MentionUtil.exists(others, newRow)) {
			enqueueSnackbar({ variant: 'warning', message: i18n('ALREADY_EXIST_ENV_KEY') });
			canceler();
			return newRow;
		}
		if (JSON.stringify(newRow) !== JSON.stringify(oldRow)) {
			const mentions = this.state.mentions?.map((m) => (m.id === newRow.id ? newRow : m));
			this.setState({ mentions }, this.writeMentions);
		}
		return newRow;
	}

	actionsRender(params: GridRowParams): ReactElement<GridActionsCellItemProps>[] {
		const id = params.id;
		const editing = this.state.rowModesModel[id]?.mode === GridRowModes.Edit;
		return editing
			? [
					<GridActionsCellItem
						key="save"
						icon={<SaveIcon />}
						label="Save"
						sx={{ color: 'primary.main' }}
						onClick={this.handleSaveClick.bind(null, id)}
					/>,
					<GridActionsCellItem
						key="cancel"
						icon={<CancelIcon />}
						label="Cancel"
						color="inherit"
						className="textPrimary"
						onClick={this.handleCancelClick.bind(null, id)}
					/>,
			  ]
			: [
					<GridActionsCellItem
						key="edit"
						icon={<EditIcon />}
						label="Edit"
						color="inherit"
						className="textPrimary"
						onClick={this.handleEditClick.bind(null, id)}
					/>,
					<GridActionsCellItem
						key="delete"
						icon={<DeleteIcon />}
						label="Delete"
						color="inherit"
						onClick={this.handleDeleteClick.bind(null, id)}
					/>,
			  ];
	}

	#columns: GridColDef[] | undefined;
	get columns(): GridColDef[] {
		if (this.#columns) return this.#columns;
		const common: Partial<GridColDef> = { type: 'string', editable: true };
		return (this.#columns = [
			{ ...common, field: 'env', headerName: i18n('TYPES_MENTION_ENV'), flex: 1 },
			{ ...common, field: 'key', headerName: i18n('TYPES_MENTION_KEY'), flex: 1 },
			{ ...common, field: 'name', headerName: i18n('TYPES_MENTION_NAME'), flex: 1 },
			{ ...common, field: 'sfid', headerName: i18n('TYPES_MENTION_SFID'), width: 180 },
			{ type: 'actions', field: 'actions', headerName: '', width: 100, getActions: this.actionsRender },
		]);
	}

	// add/removeListenerをするなら、クラスコンポーネントのほうが良い
	override componentDidMount(): void {
		chrome.storage.sync.onChanged.addListener(this.handleSyncStorageChange);
		this.readMentions();
	}
	override componentWillUnmount(): void {
		chrome.storage.sync.onChanged.removeListener(this.handleSyncStorageChange);
	}
	override render(): ReactNode {
		return (
			<Box flexGrow={1}>
				<DataGrid
					apiRef={this.props.dataGridApi}
					autoPageSize
					disableColumnSelector
					disableRowSelectionOnClick
					editMode="row"
					rows={this.state.mentions ?? []}
					rowModesModel={this.state.rowModesModel}
					columns={this.columns}
					onRowModesModelChange={this.handleRowModesModelChange}
					processRowUpdate={this.processRowUpdate}
					loading={this.state.mentions == null}
					localeText={LOCALE_TEXT}
				/>
			</Box>
		);
	}
}

const LOCALE_TEXT: Partial<GridLocaleText> = {
	columnMenuLabel: i18n('DATAGRID_COLUMN_MENU_LABEL'),
	columnHeaderSortIconLabel: i18n('DATAGRID_COLUMN_HEADER_SORT_ICON_LABEL'),
	columnMenuSortAsc: i18n('DATAGRID_COLUMN_MENU_SORT_ASC'),
	columnMenuSortDesc: i18n('DATAGRID_COLUMN_MENU_SORT_DESC'),
	columnMenuUnsort: i18n('DATAGRID_COLUMN_MENU_UNSORT'),
	columnMenuFilter: i18n('DATAGRID_COLUMN_MENU_FILTER'),
	columnHeaderFiltersTooltipActive: (c) => i18n('DATAGRID_COLUMN_HEADER_FILTERS_TOOLTIP_ACTIVE', `${c}`),
	filterPanelColumns: i18n('DATAGRID_FILTER_PANEL_COLUMNS'),
	filterPanelOperator: i18n('DATAGRID_FILTER_PANEL_OPERATOR'),
	filterPanelInputLabel: i18n('DATAGRID_FILTER_PANEL_INPUT_LABEL'),
	filterPanelInputPlaceholder: i18n('DATAGRID_FILTER_PANEL_INPUT_PLACEHOLDER'),
	filterOperatorContains: i18n('DATAGRID_FILTER_OPERATOR_CONTAINS'),
	filterOperatorEquals: i18n('DATAGRID_FILTER_OPERATOR_EQUALS'),
	filterOperatorStartsWith: i18n('DATAGRID_FILTER_OPERATOR_STARTS_WITH'),
	filterOperatorEndsWith: i18n('DATAGRID_FILTER_OPERATOR_ENDS_WITH'),
	filterOperatorIsEmpty: i18n('DATAGRID_FILTER_OPERATOR_IS_EMPTY'),
	filterOperatorIsNotEmpty: i18n('DATAGRID_FILTER_OPERATOR_IS_NOT_EMPTY'),
	filterOperatorIsAnyOf: i18n('DATAGRID_FILTER_OPERATOR_IS_ANY_OF'),
} as const;
