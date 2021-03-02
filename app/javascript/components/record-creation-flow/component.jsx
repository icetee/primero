import { useState } from "react";
import PropTypes from "prop-types";
import { Drawer } from "@material-ui/core";
import makeStyles from "@material-ui/core/styles/makeStyles";
import CloseIcon from "@material-ui/icons/Close";
import AddIcon from "@material-ui/icons/Add";
import isEmpty from "lodash/isEmpty";
import { push } from "connected-react-router";
import { useDispatch } from "react-redux";

import ActionButton from "../action-button";
import { ACTION_BUTTON_TYPES } from "../action-button/constants";
import { useI18n } from "../i18n";
import { useMemoizedSelector } from "../../libs";
import { getOptionFromAppModule } from "../application/selectors";

import { ConsentPrompt, SearchPrompt } from "./components";
import { NAME, DATA_PROTECTION_FIELDS } from "./constants";
import styles from "./styles.css";

const Component = ({ open, onClose, recordType, primeroModule }) => {
  const i18n = useI18n();
  const css = makeStyles(styles)();
  const dispatch = useDispatch();
  const canSearchAndCreate = true;
  const [openConsentPrompt, setOpenConsentPrompt] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dataProtectionFields = useMemoizedSelector(state =>
    getOptionFromAppModule(state, primeroModule, DATA_PROTECTION_FIELDS)
  );

  const goToNewCase = () => dispatch(push(`/${recordType}/${primeroModule}/new`));

  const handleSkipAndCreate = () => {
    if (isEmpty(dataProtectionFields)) {
      goToNewCase();
    } else {
      setSearchValue("");
      setOpenConsentPrompt(true);
    }
  };
  const handleCloseDrawer = () => {
    setOpenConsentPrompt(false);
    // TODO: Should reset record-list
  };

  const renderSearchPrompt = canSearchAndCreate && !openConsentPrompt && (
    <SearchPrompt
      i18n={i18n}
      onCloseDrawer={() => handleCloseDrawer(false)}
      recordType={recordType}
      setOpenConsentPrompt={setOpenConsentPrompt}
      setSearchValue={setSearchValue}
      goToNewCase={goToNewCase}
      dataProtectionFields={dataProtectionFields}
    />
  );
  const renderSkipAndCreate = !openConsentPrompt && (
    <div className={css.skipButtonContainer}>
      <ActionButton
        icon={<AddIcon />}
        text={i18n.t("case.skip_and_create")}
        type={ACTION_BUTTON_TYPES.default}
        rest={{
          onClick: handleSkipAndCreate
        }}
      />
    </div>
  );
  const renderConsentPrompt = openConsentPrompt && (
    <ConsentPrompt
      i18n={i18n}
      searchValue={searchValue}
      recordType={recordType}
      primeroModule={primeroModule}
      dataProtectionFields={dataProtectionFields}
      goToNewCase={goToNewCase}
    />
  );

  return (
    <Drawer anchor="right" open={open} onClose={() => handleCloseDrawer()} classes={{ paper: css.subformDrawer }}>
      <div className={css.container}>
        <div className={css.title}>
          <h2>{i18n.t("case.create_new_case")}</h2>
          <ActionButton
            icon={<CloseIcon />}
            text={i18n.t("cancel")}
            type={ACTION_BUTTON_TYPES.icon}
            isTransparent
            rest={{
              className: css.button,
              onClick: () => handleCloseDrawer()
            }}
          />
        </div>
        {renderSearchPrompt}
        {renderSkipAndCreate}
        {renderConsentPrompt}
      </div>
    </Drawer>
  );
};

Component.displayName = NAME;

Component.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
  primeroModule: PropTypes.string,
  recordType: PropTypes.string
};

export default Component;
