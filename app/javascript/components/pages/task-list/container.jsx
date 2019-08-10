import React, { useEffect } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import Schedule from "@material-ui/icons/Schedule";
import PriorityHigh from "@material-ui/icons/PriorityHigh";
import { makeStyles } from "@material-ui/styles";
import { useI18n } from "components/i18n";
import { IndexTable } from "components/index-table";
import { PageContainer, PageHeading } from "components/page-container";
import * as actions from "./action-creators";
import * as selectors from "./selectors";
import styles from "./styles.css";

const TaskList = ({ records, fetchTasks, meta }) => {
  useEffect(() => {
    fetchTasks();
  }, []);

  const i18n = useI18n();
  const css = makeStyles(styles)();

  const columns = [
    {
      label: "",
      name: "overdue",
      options: {
        empty: true,
        customBodyRender: value => {
          if (value) {
            return <PriorityHigh className="Overdue" fontSize="inherit" />;
          }

          return <Schedule className="Scheduled" fontSize="inherit" />;
        },
        customHeadRender: columnMeta => {
          return <th key={columnMeta.name} className={css.overdueHeading} />;
        }
      }
    },
    {
      label: i18n.t("task.id"),
      name: "id",
      id: true,
      options: {
        customBodyRender: value => {
          return <span className="RowId">{value}</span>;
        }
      }
    },
    { label: i18n.t("task.priority"), name: "priority" },
    { label: i18n.t("task.type"), name: "type" },
    {
      label: i18n.t("task.due_date"),
      name: "due_date",
      options: {
        customBodyRender: (value, tableMeta) => {
          return (
            <span className={tableMeta.rowData[4] === "true" ? "Overdue" : ""}>
              {value}
            </span>
          );
        }
      }
    }
  ];

  const options = {
    selectableRows: "none"
  };

  const tableOptions = {
    namespace: "tasks",
    path: "/tasks",
    columns,
    options,
    data: {
      records,
      meta
    },
    onTableChange: () => {}
  };

  return (
    <PageContainer>
      <PageHeading title={i18n.t("navigation.tasks")} />
      <IndexTable {...tableOptions} />
    </PageContainer>
  );
};

TaskList.propTypes = {
  records: PropTypes.object.isRequired,
  meta: PropTypes.object.isRequired,
  fetchTasks: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  records: selectors.selectTasks(state),
  meta: selectors.selectMeta(state)
});

const mapDispatchToProps = {
  fetchTasks: actions.fetchTasks
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskList);
