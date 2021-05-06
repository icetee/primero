/* eslint-disable camelcase */

import isEqual from "lodash/isEqual";
import isEmpty from "lodash/isEmpty";
import uniq from "lodash/uniq";
import omit from "lodash/omit";
import reject from "lodash/reject";
import max from "lodash/max";
import get from "lodash/get";
import orderBy from "lodash/orderBy";
import { parse } from "date-fns";

import { REPORT_FIELD_TYPES } from "../reports-form/constants";
import { STRING_SOURCES_TYPES } from "../../config";

import { DATE_PATTERN } from "./constants";

const getColors = () => {
  return ["#e0dfd6", "#595951", "#bcbcab", "green", "red", "yellow", "blue", "orange", "skyblue", "brown"];
};

const getColorsByIndex = index => {
  return getColors()[index];
};

const isDateRange = date => date.match(new RegExp(`^${DATE_PATTERN} - ${DATE_PATTERN}$`));

const getDateFormat = value => {
  if (value.match(/^\w{3}-\d{4}$/)) {
    return "MMM-yyyy";
  }
  if (value.match(new RegExp(`^${DATE_PATTERN}$`)) || isDateRange(value)) {
    return "dd-MMM-yyyy";
  }

  return null;
};

const translateDate = (value, i18n, dateFormat) => {
  if (isDateRange(value)) {
    const splittedDateRange = value.split(" - ");
    const dateFrom = parse(splittedDateRange[0], dateFormat, new Date());
    const dateTo = parse(splittedDateRange[1], dateFormat, new Date());

    const dateFromLocalized = dateFrom ? i18n.localizeDate(dateFrom, dateFormat) : i18n.l(value);
    const dateToLocalized = dateTo ? i18n.localizeDate(dateTo, dateFormat) : i18n.l(value);

    return `${dateFromLocalized} - ${dateToLocalized}`;
  }
  const date = parse(value, dateFormat, new Date());

  return date ? i18n.localizeDate(date, dateFormat) : i18n.l(value);
};

const sortByDate = (data, multiple = false) => {
  return orderBy(
    data,
    curr => {
      return new Date(multiple ? curr[0] : curr);
    },
    ["asc"]
  );
};

const getColumnData = (column, data, i18n, qtyColumns, qtyRows) => {
  const totalLabel = i18n.t("report.total");
  const keys = sortByDate(Object.keys(data));

  if (qtyRows >= 2 && qtyColumns > 0) {
    const firstRow = keys;
    const secondRow = Object.keys(data[firstRow[0]]).filter(key => key !== totalLabel);

    return keys.reduce((firstRowAccum, firstRowCurr) => {
      const secondRowAccum = secondRow
        .map(secondLevel => {
          return data[firstRowCurr][secondLevel][column][totalLabel];
        })
        .reduce((acc, curr) => acc + curr);

      return [...firstRowAccum, secondRowAccum];
    }, []);
  }

  return keys
    .filter(key => key !== totalLabel)
    .map(key => {
      const columnValue = data[key][column]
        ? data[key][column][totalLabel]
        : getColumnData(column, data[key], i18n, qtyColumns, qtyRows);

      return columnValue;
    })
    .flat();
};

const getColumns = (data, i18n, qtyColumns, qtyRows) => {
  const totalLabel = i18n.t("report.total");
  const columnsArray = isNested => {
    return uniq(
      Object.values(data)
        .map(currValue => Object.keys(isNested ? Object.values(currValue)[0] : currValue))
        .flat()
    ).filter(key => key !== totalLabel);
  };

  if (qtyRows >= 2 && qtyColumns > 0) {
    return columnsArray(true);
  }

  return columnsArray();
};

const containsColumns = (columns, data, i18n) => {
  const totalLabel = i18n.t("report.total");
  const keys = Object.keys(data).filter(key => key !== totalLabel);

  return isEqual(columns, keys);
};

const getTranslatedKey = (key, field, { agencies, i18n, locations } = {}) => {
  const isBooleanKey = ["true", "false"].includes(key);

  if (field?.option_strings_source === STRING_SOURCES_TYPES.AGENCY && agencies?.length > 0) {
    return agencies.find(agency => agency.id.toLowerCase() === key.toLowerCase())?.display_text;
  }

  if (field?.option_strings_source === STRING_SOURCES_TYPES.LOCATION && locations?.length > 0) {
    return locations.find(location => location.id === key.toUpperCase())?.display_text;
  }

  if (i18n && isBooleanKey) {
    return i18n.t(key);
  }

  return key;
};

const dataSet = (columns, data, i18n, fields, qtyColumns, qtyRows, { agencies, locations }) => {
  const totalLabel = i18n.t("report.total");
  const dataResults = [];
  const field =
    fields.length > 1
      ? fields.find(reportField => reportField.position.type === REPORT_FIELD_TYPES.vertical)
      : fields.shift();

  if (!isEmpty(columns)) {
    sortByDate(columns).forEach((column, i) => {
      const label = getTranslatedKey(column, field, { agencies, locations });
      const dateFormat = getDateFormat(label);
      const formattedLabel = dateFormat ? translateDate(label, i18n, dateFormat) : label;

      dataResults.push({
        label: formattedLabel,
        data: getColumnData(column, data, i18n, qtyColumns, qtyRows),
        backgroundColor: getColorsByIndex(i)
      });
    });
  } else {
    dataResults.push({
      label: totalLabel,
      data: Object.keys(data).map(column => data[column][totalLabel]),
      backgroundColor: getColorsByIndex(0)
    });
  }

  return dataResults;
};

const getLabels = (columns, data, i18n, fields, qtyColumns, qtyRows, { agencies, locations }) => {
  const totalLabel = i18n.t("report.total");
  const currentLabels = [];
  const field = fields.shift();
  const keys = sortByDate(Object.keys(data));

  if (qtyRows >= 2 && qtyColumns > 0) {
    return keys;
  }

  keys.forEach(key => {
    if (containsColumns(columns, data[key], i18n)) {
      currentLabels.push(
        keys
          .map(current => {
            const dateFormat = getDateFormat(current);

            return dateFormat ? translateDate(current, i18n, dateFormat) : current;
          })
          .filter(label => label !== totalLabel)
      );
    } else {
      currentLabels.concat(getLabels(columns, data[key], i18n, fields, qtyColumns, qtyRows, { agencies, locations }));
    }
  });

  return uniq(currentLabels.flat()).map(key =>
    getTranslatedKey(key, field, {
      agencies,
      locations
    })
  );
};

const findInOptionLabels = (optionLabels, value, locale = "en") =>
  optionLabels[locale].find(option => option.id === value);

const translateKeys = (keys, field, locale) => {
  const { option_labels: optionLabels } = field;

  if (!isEmpty(optionLabels)) {
    const translations = optionLabels[locale].map(({ id, display_text: displayText }) => {
      const fallbackDisplayText = isEmpty(displayText)
        ? findInOptionLabels(optionLabels, id)?.display_text
        : displayText;

      return {
        id,
        display_text: fallbackDisplayText
      };
    });

    return translations.filter(translation => keys.includes(translation.id));
  }
  if (field.option_strings_source === "Location") {
    // TODO: Pull locations
  }

  return [];
};

const translateData = (data, fields, i18n, { agencies, locations } = {}) => {
  const currentTranslations = {};
  const keys = Object.keys(data);
  const { locale } = i18n;

  if (keys.length === 1 && keys.includes("_total")) {
    currentTranslations[i18n.t("report.total")] = data._total;
    delete currentTranslations._total;
  } else if (!isEmpty(keys)) {
    const field = fields.shift();

    const storedFields = [...fields];
    const translations = translateKeys(keys, field, locale);

    keys.forEach(key => {
      if (key === "_total") {
        const translatedKey = i18n.t("report.total");

        currentTranslations[translatedKey] = data[key];
        delete currentTranslations[key];
      } else {
        // We are not translating dates here!
        const translation = translations.find(t => t.id === key);

        const translatedKey = translation
          ? translation.display_text
          : getTranslatedKey(key, field, { agencies, i18n, locations });

        if (translation) {
          currentTranslations[translatedKey] = { ...data[key] };
          delete currentTranslations[key];
        }
        const translatedData = translateData(data[key], [...storedFields], i18n, { agencies, locations });

        currentTranslations[translatedKey] = translatedData;
      }
    });
  }

  return currentTranslations;
};

const translateReportData = (report, i18n, { agencies, locations } = {}) => {
  const translatedReport = { ...report };

  if (translatedReport.report_data) {
    translatedReport.report_data = translateData(report.report_data, report.fields, i18n, { agencies, locations });
  }

  return translatedReport;
};

const translateColumn = (column, value, locale = "en") => {
  if ("option_labels" in column) {
    return findInOptionLabels(column.option_labels, value, locale)?.display_text || value;
  }

  return value;
};

const getColumnsObjects = (object, countRows) => {
  let level = 0;

  // eslint-disable-next-line consistent-return
  const getColumnsObj = obj => {
    if (level >= countRows) {
      return obj;
    }

    const keys = Object.keys(obj);

    for (let i = 0; i < keys.length; i += 1) {
      level += 1;

      return getColumnsObj(obj[keys[i]]);
    }
  };

  // Removing "_total" from columns object
  return omit(getColumnsObj(object), "_total");
};

const getAllKeysObject = object => {
  const allKeys = (obj, prefix = "") => {
    return sortByDate(Object.keys(obj).filter(o => o !== "Total"))
      .concat("Total")
      .reduce((acc, el) => {
        if (typeof obj[el] === "object") {
          return [...acc, ...allKeys(obj[el], `${prefix + el}.`)];
        }

        return [...acc, prefix + el];
      }, []);
  };

  return allKeys(object);
};

const cleanedKeys = (object, columns) => {
  const allKeys = getAllKeysObject(object);

  return reject(
    allKeys.map(r => {
      const splitted = r.split(".");

      const newSplitted = splitted.filter(s => splitted.length >= columns.length + 1 && s !== "_total");

      return newSplitted.join(".");
    }),
    isEmpty
  );
};

const formatColumns = (formattedKeys, columns, i18n) => {
  const items = columns.map((column, index) => {
    const columnsHeading = i =>
      formattedKeys.map(c => {
        const splitted = c.split(".");

        return translateColumn(column, splitted[i]);
      });

    const uniqueItems = sortByDate(uniq(columnsHeading(index).concat("Total"))).map(columnHeading => {
      const dateFormat = getDateFormat(columnHeading);

      return dateFormat ? translateDate(columnHeading, i18n, dateFormat) : columnHeading;
    });

    return {
      items: uniqueItems
    };
  });

  const colspan = max(items.map((item, index) => (index === 1 ? item.items.length : 0)));

  return items.map((f, index) => {
    if (columns.length === 1) {
      return f.items;
    }

    return {
      ...f,
      colspan: index === columns.length - 1 ? 0 : colspan
    };
  });
};

const getColumnsTableData = (data, i18n) => {
  if (isEmpty(data.report_data)) {
    return [];
  }

  const columns = data.fields.filter(field => field.position.type === "vertical");
  const qtyRows = data.fields.filter(field => field.position.type === "horizontal").length;
  const columnsObjects = getColumnsObjects(data.report_data, qtyRows);
  const cleaned = sortByDate(cleanedKeys(columnsObjects, columns));
  const renderColumns = formatColumns(cleaned, columns, i18n).flat();

  return renderColumns;
};

const getRowsTableData = (data, i18n) => {
  if (isEmpty(data.report_data)) {
    return [];
  }
  const rows = data.fields.filter(field => field.position.type === "horizontal");
  const accum = [];
  const rowEntries = sortByDate(Object.entries(data.report_data), true);

  rowEntries.forEach(entry => {
    const [key, value] = entry;
    const qtyOfParentKeys = rows.length;

    if (qtyOfParentKeys >= 2) {
      accum.push([key, true, value._total || value.Total]);
      const result = sortByDate(Object.keys(value))
        .filter(val => !["_total", i18n.t("report.total")].includes(val))
        .map(rowDisplayName => {
          const childObject = getAllKeysObject(value[rowDisplayName]);

          const values = childObject.map(child => {
            return get(value[rowDisplayName], child);
          });

          return [rowDisplayName, false, ...values];
        });

      // Set rest of keys
      const innerRows = [...sortByDate(result, true)].map(innerRow => {
        const [enDate, ...enValues] = innerRow;
        const dateFormat = getDateFormat(enDate);

        const dateOrExistingKey = dateFormat ? translateDate(enDate, i18n, dateFormat) : enDate;

        return [dateOrExistingKey, ...enValues];
      });

      accum.push(...innerRows);
    } else {
      const valuesAccesor = getAllKeysObject(value);
      const values = valuesAccesor
        .filter(val => !["_total", i18n.t("report.total")].includes(val))
        .map(val => get(value, val));

      const dateFormat = getDateFormat(key);
      const dateOrKey = dateFormat ? translateDate(key, i18n, dateFormat) : key;

      accum.push([dateOrKey, false, ...values, value._total || value.Total]);
    }
  });

  return accum;
};

const formatRows = (rows, translation, columns) => {
  const maxItems = max(rows.map(row => row.length));

  return rows.map(row => {
    // applyRowStyle only gets applied when there are not columns defined in the report
    const [key, applyRowStyle, ...rest] = row;

    const translatedKey =
      translation
        .reduce((acc, prev) => {
          if ("option_labels" in prev) {
            return [...acc, ...prev.option_labels.en];
          }

          return acc;
        }, [])
        .find(option => option.id === key)?.display_text || key;

    const result = {
      // eslint-disable-next-line no-nested-ternary
      colspan: maxItems === row.length ? (applyRowStyle && isEmpty(columns) ? 1 : 0) : maxItems - 2,
      row: [translatedKey, ...rest]
    };

    return result;
  });
};

export const buildDataForTable = (report, i18n, { agencies, locations }) => {
  const { fields } = report.toJS();
  const translatedReport = translateReportData(report.toJS(), i18n, { agencies, locations });
  const translatedReportWithAllFields = {
    ...translatedReport,
    fields
  };

  const newColumns = getColumnsTableData(translatedReportWithAllFields, i18n);
  const newRows = getRowsTableData(translatedReportWithAllFields, i18n);

  const columns = newColumns;
  const rows = report.toJS()?.fields?.filter(field => field.position.type === "horizontal");
  const values = formatRows(newRows, rows, columns);

  return { columns, values };
};

export const buildDataForGraph = (report, i18n, { agencies, locations }) => {
  const reportData = report.toJS();

  if (!reportData.report_data) {
    return {};
  }
  const { fields } = report.toJS();
  const translatedReport = translateReportData(reportData, i18n);
  const qtyColumns = fields.filter(field => field.position.type === REPORT_FIELD_TYPES.vertical).length;
  const qtyRows = fields.filter(field => field.position.type === REPORT_FIELD_TYPES.horizontal).length;
  const columns = getColumns(translatedReport.report_data, i18n, qtyColumns, qtyRows);

  const graphData = {
    description: translatedReport.description ? translatedReport.description[i18n.locale] : "",
    data: {
      labels: getLabels(columns, translatedReport.report_data, i18n, report.toJS().fields, qtyColumns, qtyRows, {
        agencies,
        locations
      }),
      datasets: dataSet(columns, translatedReport.report_data, i18n, fields, qtyColumns, qtyRows, {
        agencies,
        locations
      })
    }
  };

  return graphData;
};
