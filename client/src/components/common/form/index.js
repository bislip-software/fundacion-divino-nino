import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { cloneDeep } from "lodash";

import {
  selectDoctype,
  selectDoctypeFields,
  selectDoctypePermissions,
  selectDoctypeDependentFields,
} from "../../../store/doctypes/selectors";

import {
  selectFormDocument,
  selectFormLoading,
} from "../../../store/forms/selectors";

import {
  fetchFormDocumentRequest,
  updateFormDocumentData,
} from "../../../store/forms/actions";

import {
  createDocumentsRequest,
  updateDocumentsRequest,
} from "../../../store/documents/actions";

import Input from "../input";
import Button from "../button";
import Comments from "../comments";
import TopSection from "../top_section";

const Container = styled.div``;

const Heading = styled.h2``;

const MainSection = styled.div`
  display: flex;
  margin: 0 auto;
  margin-bottom: 30px;
  @media (min-width: 750px) {
    width: 80%;
  }
`;

const Form = styled.form`
  width: 100%;
  border-left: 1px solid #d1d8dd;
  border-right: 1px solid #d1d8dd;
  border-bottom: 1px solid #d1d8dd;
  padding: 15px;
  border-radius: 0 0 3px 3px;
`;

const Column = styled.div`
  padding: 0 15px 15px 15px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 15px 30px;
`;

const BottomSection = styled.div`
  display: flex;
  margin: 0 auto;
  @media (min-width: 750px) {
    width: 80%;
  }
`;

const FormView = ({ location }) => {
  const [, , , doctype, docname] = location.pathname.split("/");

  const formRef = useRef();
  const dispatch = useDispatch();
  const doctypeData = useSelector(selectDoctype(doctype));
  const doctypeFields = useSelector(selectDoctypeFields(doctype));
  const doctypePermissions = useSelector(selectDoctypePermissions(doctype));
  const doctypeDependentFields = useSelector(
    selectDoctypeDependentFields(doctype)
  );
  const documentData = useSelector(selectFormDocument(docname));

  const [state, setState] = useState({});
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    // Populate every Link and Table field
    const populate = doctypeFields
      .reduce((acc, val) => {
        if (
          val.field_type === "Link" ||
          val.field_type === "Table Link" ||
          val.field_type === "Table"
        ) {
          acc.push(val.field_name);
        }
        return acc;
      }, [])
      .join(",");

    // Fetch document based on doctype and docname
    const query = { model: doctype, name: docname, populate };
    dispatch(fetchFormDocumentRequest(query));

    /* return () => dispatch(updateFormDocumentData({ name: docname, data: state })); */
  }, []);

  useEffect(() => {
    // Reshape object and fill the form based on document data

    const stateObject = doctypeFields.reduce((acc, val) => {
      const { field_name, field_type } = val;

      if (documentData[field_name]) {
        acc[field_name] = documentData[field_name];
      } else {
        if (field_type === "Number") {
          acc[field_name] = val.default ? Number(val.default) : 0;
        } else if (field_type === "Check") {
          acc[field_name] = val.default === "true" ? true : false;
        } else if (field_type === "Link" || field_type === "Table Link") {
          acc[field_name] = {};
        } else if (field_type === "Date" || field_type === "Time") {
          acc[field_name] = val.default ? new Date() : "";
        } else if (field_type === "Table") {
          acc[field_name] = [];
        } else {
          acc[field_name] = val.default;
        }
      }

      return acc;
    }, {});

    stateObject._comments = documentData._comments || [];

    setIsNew(Object.keys(documentData).length === 0);
    setState(stateObject);
  }, [documentData]);

  const onChange = (index, name, value) => {
    const newState = cloneDeep(state);

    // Works for date, number, password, text, textarea and link inputs
    newState[name] = value;
    // Still need to handle check, link, select inputs

    doctypeDependentFields.forEach((field) => {
      const { field_name, field_type, depends_on, fetch_from } = field;
      const doc = newState;

      if (doc[depends_on]) {
        const [key, subkey] = fetch_from.split(".");

        if (doc[key][subkey] === undefined) {
          if (field_type === "Number") doc[field_name] = 0;
          if (field_type === "Data") doc[field_name] = "";
        } else {
          doc[field_name] = doc[key][subkey];
        }
      } else {
        try {
          doc[field_name] = eval(depends_on.split("eval:")[1]);
        } catch (error) {
          if (field_type === "Number") doc[field_name] = 0;
          if (field_type === "Data") doc[field_name] = "";
        }
      }
    });

    setState(newState);
  };

  const submitDocument = () => {
    const valid = formRef.current.reportValidity();
    if (!valid) return;

    // Clone state
    const newState = cloneDeep(state);

    // Calculate hidden fields
    /* if (onSubmit) onSubmit(newState); */

    // Transform state
    doctypeFields.forEach((field) => {
      if (field.field_type === "Link" || field.field_type === "Table Link") {
        newState[field.field_name] = newState[field.field_name]._id;
      }

      if (field.field_type === "Table") {
        newState[field.field_name].forEach((object) => {
          for (const key in object) {
            if (typeof object[key] === "object") {
              object[key] = object[key] ? object[key]._id : null;
            }
          }
        });
      }
    });

    // Prepare query
    const query = { model: doctype, name: docname };

    const [subfields, submodels] = doctypeFields.reduce(
      (acc, val) => {
        if (val.field_type === "Table") {
          acc[0].push(val.field_name);
          acc[1].push(val.options);
        }
        return acc;
      },
      [[], []]
    );

    query.subfields = subfields.join(",");
    query.submodels = submodels.join(",");

    // Determine action type
    if (isNew) {
      dispatch(createDocumentsRequest(query, [newState]));
    }

    if (!isNew) {
      dispatch(updateDocumentsRequest(query, [newState]));
    }
  };

  /* console.log(state); */

  return (
    <Container>
      <TopSection
        left={
          <Heading>
            {isNew ? `${doctypeData.caption} (Nuevo Documento)` : `${docname}`}
          </Heading>
        }
        right={
          <>
            {isNew && doctypePermissions.create && (
              <Button bgColor="#0057a6" color="#fff" onClick={submitDocument}>
                Crear
              </Button>
            )}
            {!isNew && doctypePermissions.update && (
              <Button bgColor="#0057a6" color="#fff" onClick={submitDocument}>
                Guardar
              </Button>
            )}
          </>
        }
      />

      {Object.keys(state).length > 0 && (
        <>
          <MainSection>
            <Form ref={formRef}>
              <Column>
                {doctypeFields.map(
                  ({ hidden, ...field }) =>
                    !hidden && (
                      <Input
                        key={field.field_name}
                        doc={state}
                        onChange={onChange}
                        parent_model={doctype}
                        parent_name={docname}
                        {...field}
                      />
                    )
                )}
              </Column>
            </Form>
          </MainSection>

          <BottomSection>
            <Comments doc={state} field_name="_comments" onChange={onChange} />
          </BottomSection>
        </>
      )}
    </Container>
  );
};

export default FormView;
