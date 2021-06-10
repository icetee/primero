import { useState } from "react";
import PropTypes from "prop-types";
import { Box, IconButton, makeStyles, Typography } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import isEmpty from "lodash/isEmpty";

import { useI18n } from "../../../i18n";
import { DATE_FIELD } from "../../../form";
import FiltersDialog from "../filters-dialog";
import { MODULES_FIELD, NOT_NULL, RECORD_TYPE_FIELD } from "../../constants";
import { formattedFields } from "../../utils";
import { dataToJS, useMemoizedSelector, useThemeHelper } from "../../../../libs";
import { getOptions } from "../../../record-form/selectors";
import { getOptions as specialOptions } from "../../../form/selectors";
import { OPTION_TYPES, NUMERIC_FIELD, RADIO_FIELD, SELECT_FIELD } from "../../../form/constants";
import ActionDialog from "../../../action-dialog";

import { NAME } from "./constants";
import styles from "./styles.css";
import { formatValue, getConstraintLabel, registerValues } from "./utils";

const useStyles = makeStyles(styles);

const Container = ({
  indexes,
  setIndexes,
  allRecordForms,
  parentFormMethods,
  reportingLocationConfig,
  formattedMinimumReportableFields
}) => {
  const i18n = useI18n();
  const css = useStyles();
  const { isRTL } = useThemeHelper();

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [open, setOpen] = useState(false);

  const onSuccess = (index, currentReportFilter, currentField) => {
    const data =
      currentField.type === DATE_FIELD && Array.isArray(currentReportFilter.value) && isEmpty(currentReportFilter.value)
        ? { ...currentReportFilter, value: formatValue(new Date(), i18n, {}) }
        : currentReportFilter;

    if ([DATE_FIELD, NUMERIC_FIELD].includes(currentField.type) && currentReportFilter.constraint === NOT_NULL) {
      data.value = "";
    }

    if (
      [SELECT_FIELD, RADIO_FIELD].includes(currentField.type) &&
      typeof currentReportFilter.constraint === "boolean" &&
      currentReportFilter.constraint
    ) {
      data.constraint = false;
      data.value = [NOT_NULL];
    }

    if (Object.is(index, null)) {
      setIndexes([...indexes, { index: indexes.length, data }]);
      registerValues(indexes.length, data, indexes, parentFormMethods);
    } else {
      const indexesCopy = [...indexes].slice();

      indexesCopy[index] = { ...indexesCopy[index], data };

      setIndexes(indexesCopy);
      registerValues(index, data, indexes, parentFormMethods);
    }
  };

  const allLookups = useMemoizedSelector(state => getOptions(state));
  const location = useMemoizedSelector(state => specialOptions(state, OPTION_TYPES.LOCATION, i18n));
  const agencies = useMemoizedSelector(state => specialOptions(state, OPTION_TYPES.AGENCY, i18n));
  const modules = useMemoizedSelector(state => specialOptions(state, OPTION_TYPES.MODULE, i18n));
  const formGroups = useMemoizedSelector(state => specialOptions(state, OPTION_TYPES.FORM_GROUP, i18n));

  const selectedModules = parentFormMethods.getValues()[MODULES_FIELD];
  const selectedRecordType = parentFormMethods.getValues()[RECORD_TYPE_FIELD];

  const fields = formattedFields(
    allRecordForms,
    selectedModules,
    selectedRecordType,
    i18n,
    reportingLocationConfig,
    formattedMinimumReportableFields
  );

  if (!fields.length) {
    return null;
  }

  const handleNew = () => {
    setOpen(true);
  };

  const handleEdit = index => {
    setSelectedIndex(index.toString());
    setOpen(true);
  };

  const handleDelete = () => {
    const index = selectedIndex;

    setIndexes([...indexes.slice(0, parseInt(index, 10)), ...indexes.slice(parseInt(index, 10) + 1, indexes.length)]);
  };

  const handleOpenModal = index => {
    setSelectedIndex(index);
    setDeleteModal(true);
  };

  const cancelHandler = () => {
    setDeleteModal(false);
    setSelectedIndex(null);
  };

  const renderReportFilterList = () => {
    if (isEmpty(indexes)) {
      return <p>{i18n.t("report.no_filters_added")}</p>;
    }

    const handleClickOpen = index => () => handleOpenModal(index);
    const handleClickEdit = index => () => handleEdit(index);

    return Object.entries(indexes).map(filter => {
      const [index, { data }] = filter;
      const { attribute, value } = data;
      const field = fields.find(f => f.id === attribute);

      if (!field) return false;

      const constraintLabel = getConstraintLabel(data, field, i18n);
      const lookups = [
        ...dataToJS(allLookups),
        ...[{ unique_id: OPTION_TYPES.LOCATION, values: dataToJS(location) }],
        ...[{ unique_id: OPTION_TYPES.AGENCY, values: dataToJS(agencies) }],
        ...[{ unique_id: OPTION_TYPES.MODULE, values: dataToJS(modules) }],
        ...[{ unique_id: OPTION_TYPES.FORM_GROUP, values: dataToJS(formGroups) }]
      ];

      const formattedReportFilterName = [
        // eslint-disable-next-line camelcase
        field?.display_text || "",
        i18n.t("report.filters.is"),
        constraintLabel,
        formatValue(value, i18n, { field, lookups })
      ].join(" ");

      const renderIcon = isRTL ? <KeyboardArrowLeft /> : <KeyboardArrowRight />;

      return (
        <Box key={index} display="flex" alignItems="center">
          <Box flexGrow={1}>{formattedReportFilterName}</Box>
          <Box>
            <IconButton onClick={handleClickOpen(index)}>
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={handleClickEdit(index)}>{renderIcon}</IconButton>
          </Box>
        </Box>
      );
    });
  };

  return (
    <>
      <Typography className={css.filtersHeading}>
        {i18n.t("report.filters.label")}
        <IconButton size="small" onClick={handleNew} className={css.addFilter}>
          <AddIcon />
          {i18n.t("buttons.new")}
        </IconButton>
      </Typography>

      {renderReportFilterList()}

      <ActionDialog
        open={deleteModal}
        successHandler={handleDelete}
        cancelHandler={cancelHandler}
        dialogTitle={i18n.t("fields.remove")}
        dialogText={i18n.t("report.filters.delete_filter_message")}
        confirmButtonLabel={i18n.t("buttons.ok")}
      />

      <FiltersDialog
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        open={open}
        setOpen={setOpen}
        indexes={indexes}
        fields={fields}
        onSuccess={onSuccess}
      />
    </>
  );
};

Container.displayName = NAME;

Container.propTypes = {
  allRecordForms: PropTypes.object.isRequired,
  formattedMinimumReportableFields: PropTypes.object,
  indexes: PropTypes.array,
  parentFormMethods: PropTypes.object.isRequired,
  reportingLocationConfig: PropTypes.object,
  setIndexes: PropTypes.func
};

export default Container;
