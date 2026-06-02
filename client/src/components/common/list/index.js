import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import styled from "styled-components";
import moment from "moment";

import {
  selectDoctype,
  selectDoctypeFields,
  selectDoctypeListFields,
  selectDoctypeSortFields,
  selectDoctypePermissions,
  selectDoctypeSearchFields,
} from "../../../store/doctypes/selectors";

import {
  setListLimit,
  setListSortOrder,
  setListSortField,
  resetDocuments,
  fetchDocumentsRequest,
  deleteDocumentsRequest,
} from "../../../store/documents/actions";

import {
  selectLimit,
  selectSortOrder,
  selectSortField,
  selectDocuments,
} from "../../../store/documents/selectors";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import TopSection from "../top_section";
import Input from "../input";
import Button from "../button";

const Container = styled.div`
  margin-bottom: 100px;
`;

const Heading = styled.h2``;

const AdvancedFilters = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  padding: 10px;
  border-left: 1px solid #d1d8dd;
  border-right: 1px solid #d1d8dd;
  border-bottom: 1px solid #d1d8dd;

  @media (min-width: 750px) {
    width: 80%;
  }
`;

const Filters = styled.div``;

const Sorting = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SortingField = styled.div`
  position: relative;
`;

const SortingFieldLabel = styled.span`
  font-size: 0.75em;
  color: #8d99a6;
  cursor: pointer;
  margin-right: 10px;

  :hover {
    text-decoration: underline;
  }
`;

const SortingOptions = styled.div`
  position: absolute;
  top: 25px;
  right: 0;
  width: 200px;
  border: 1px solid #d1d8dd;
  border-radius: 0 0 4px 4px;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.176);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  background-color: #fbfbfb;
  transform-origin: top right;
`;

const SortingOption = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: center;
  padding: 8px 12px;
  font-size: 0.75em;
  min-height: 50px;
  cursor: pointer;
  transition: color 0.2s;

  :hover {
    color: #36414c;
    background-color: #f0f4f7;
  }
`;

const SortingOrder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 25px;
  height: 25px;
  border-radius: 3px;
  background-color: #f0f4f7;
  cursor: pointer;
`;

const Icon = styled(FontAwesomeIcon)`
  font-size: 0.8em;
  path {
    color: ${(props) => props.color || "unset"};
  }
`;

const Table = styled.div`
  min-height: calc(100vh - 220px);
  border-left: 1px solid #d1d8dd;
  border-right: 1px solid #d1d8dd;

  margin: 0 auto;

  @media (min-width: 750px) {
    width: 80%;
  }
`;

const TableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  height: 40px;
  font-size: 0.75em;
  border-bottom: 1px solid #d1d8dd;

  :first-child {
    background-color: #f7fafc;
  }

  :hover {
    background-color: #f7fafc;
  }
`;

const TableDescription = `
  flex: 1;
  pointer-events: none;

  :first-child {
    flex: 0;
    min-width: 26px;
  }

  :nth-child(2) {
    flex: 1.5;
  }

  :last-child {
    flex: 0.5;
  }
`;

const TableHeader = styled.div`
  ${TableDescription}
  color: #8d99a6;
`;

const TableColumn = styled.div`
  ${TableDescription}
  color: #6c7680;
`;

const StyledLinkA = styled(Link)`
  color: #36414c;
  transition: color 0.5s;
  pointer-events: all;

  :hover {
    color: #161b1f;
    text-decoration: underline;
  }
`;

const StyledLinkB = styled(Link)`
  margin-left: auto;
  color: inherit;
  pointer-events: all;
`;

const StyledIcon = styled(FontAwesomeIcon)`
  font-size: 1.1em;
  cursor: pointer;
  pointer-events: all;

  path {
    color: ${(props) => (props.selected ? "inherit" : "#d1d8dd")};
  }
`;

const Span = styled.span`
  color: inherit;
  pointer-events: all;
  font-weight: ${(props) => (props.bold ? "bold" : "normal")};
`;

const Message = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 260px);
`;

const Text = styled.span`
  font-size: 0.8em;
  color: #8d99a6;
  margin-bottom: 10px;
`;

const Buttons = styled.div`
  margin: 0 auto;
  padding: 12px 18px;
  border-left: 1px solid #d1d8dd;
  border-right: 1px solid #d1d8dd;
  border-bottom: 1px solid #d1d8dd;
  border-radius: 0 0 3px 3px;

  @media (min-width: 750px) {
    width: 80%;
  }
`;

const LimitButton = styled.button`
  background-color: ${(props) => (props.active ? "#888888" : "#e3e7eb")};
  color: ${(props) => (props.active ? "#fbfbfb" : "#888888")};
  font-size: 0.75em;
  padding: 8px 15px;
  cursor: pointer;
  transition: box-shadow 0.25s;
  outline: 0;
  margin: 0;

  :hover {
    box-shadow: inset 0 0 100px 100px rgba(0, 0, 0, 0.15);
  }

  :nth-child(1) {
    border-radius: 3px 0 0 3px;
  }
  :nth-child(2) {
    border-radius: 0;
  }
  :nth-child(3) {
    border-radius: 0 3px 3px 0;
  }
`;

const ListView = ({ match }) => {
  const doctype = match.params.doctype;
  const history = useHistory();
  const dispatch = useDispatch();
  const doctypeData = useSelector(selectDoctype(doctype));
  const doctypeFields = useSelector(selectDoctypeFields(doctype));
  const doctypeListFields = useSelector(selectDoctypeListFields(doctype));
  const doctypeSortFields = useSelector(selectDoctypeSortFields(doctype));
  const doctypePermissions = useSelector(selectDoctypePermissions(doctype));
  const doctypeSearchFields = useSelector(selectDoctypeSearchFields(doctype));
  const documentData = useSelector(selectDocuments(doctype));

  const limit = useSelector(selectLimit(doctype));
  const sort_order = useSelector(selectSortOrder(doctype));
  const sort_field = useSelector(selectSortField(doctype));

  const [state, setState] = useState(documentData);
  const [filters, setFilters] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [showSortingOptions, setShowSortingOptions] = useState(false);

  const selectedItemsKeys = Object.keys(selectedItems);
  const areAllSelected =
    selectedItemsKeys.length > 0 && selectedItemsKeys.length === state.length;

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    setState(documentData);
  }, [documentData]);

  useEffect(() => {
    fetchDocuments();
  }, [limit, sort_field.field_name, sort_order]);

  const redirectToForm = (e) => {
    const name = e.target.dataset.name;
    const link = `/desk/Form`;
    if (name) history.push(`${link}/${doctype}/${name}`);
    else history.push(`${link}/${doctype}/New ${doctype}`);
  };

  const fetchDocuments = () => {
    // Populate every Link and Table Link field
    const populate = doctypeFields
      .reduce((acc, val) => {
        if (val.field_type === "Link" || val.field_type === "Table Link") {
          acc.push(val.field_name);
        }
        return acc;
      }, [])
      .join(",");

    const query = {
      model: doctype,
      populate,
      limit,
      sort: `${sort_field.field_name} ${sort_order}`,
    };

    dispatch(fetchDocumentsRequest(query));
  };

  const deleteDocuments = () => {
    const query = { model: doctype };

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

    const [ids, names] = selectedItemsKeys.reduce(
      (acc, val, idx) => {
        acc[0].push(state[val]._id);
        acc[1].push(state[val].name);
        return acc;
      },
      [[], []]
    );

    dispatch(deleteDocumentsRequest(query, { ids, names }));
    setSelectedItems({});
    fetchDocuments();
  };

  const selectItem = (index) => {
    const newState = { ...selectedItems };

    if (newState[index]) {
      delete newState[index];
    } else {
      newState[index] = state[index];
    }

    setSelectedItems(newState);
  };

  const selectAllItems = (e) => {
    if (selectedItemsKeys.length === state.length) {
      setSelectedItems({});
    } else {
      setSelectedItems(
        state.reduce((acc, val, idx) => {
          acc[idx] = val;
          return acc;
        }, {})
      );
    }
  };

  const loadMore = (limit) => {
    dispatch(setListLimit({ model: doctype, limit }));
  };

  const addFilter = () => {
    //
  };

  const clearFilters = () => {
    //
  };

  const onChange = (index, name, value) => {
    /* setFilters({ ...filters, [name]: value }); */
  };

  const changeSortOrder = () => {
    const newOrder = sort_order === "asc" ? "desc" : "asc";
    dispatch(setListSortOrder({ model: doctype, sort_order: newOrder }));
  };

  const changeSortField = (index) => {
    const newField = doctypeSortFields[index];
    dispatch(setListSortField({ model: doctype, sort_field: newField }));
    shouldHideSortingOptions();
  };

  const shouldShowSortingOptions = () => {
    setShowSortingOptions(true);
  };

  const shouldHideSortingOptions = () => {
    setTimeout(() => {
      setShowSortingOptions(false);
    }, 150);
  };

  return (
    <Container>
      <TopSection
        left={<Heading>{doctypeData.caption}</Heading>}
        right={
          selectedItemsKeys.length > 0 ? (
            <Button bgColor="#da003e" color="#fff" onClick={deleteDocuments}>
              Eliminar
            </Button>
          ) : (
            <>
              <Button onClick={fetchDocuments}>Refrescar</Button>
              {doctypePermissions.create && (
                <Button bgColor="#0057a6" color="#fff" onClick={redirectToForm}>
                  Nuevo
                </Button>
              )}
            </>
          )
        }
      />

      <AdvancedFilters>
        <Filters>
          <Button style={{ padding: "4px 8px" }} onClick={addFilter}>
            Agregar Filtro
          </Button>
          <Button style={{ padding: "4px 8px" }} onClick={clearFilters}>
            Quitar Filtros
          </Button>
        </Filters>

        <Sorting>
          <SortingField>
            <SortingFieldLabel
              onClick={shouldShowSortingOptions}
              onBlur={shouldHideSortingOptions}
              tabIndex={0}
            >
              {sort_field.label}
            </SortingFieldLabel>
            {showSortingOptions && (
              <SortingOptions>
                {doctypeSortFields.map((field, index) => (
                  <SortingOption
                    key={`${index}-${field.field_name}`}
                    onClick={changeSortField.bind(null, index)}
                  >
                    {field.label}
                  </SortingOption>
                ))}
              </SortingOptions>
            )}
          </SortingField>

          <SortingOrder onClick={changeSortOrder}>
            <Icon
              icon={sort_order === "asc" ? "arrow-down" : "arrow-up"}
              color="#999999"
            />
          </SortingOrder>
        </Sorting>
      </AdvancedFilters>

      <Table>
        <TableRow>
          <TableHeader>
            {doctypePermissions.delete && (
              <Input
                field_name="check_all"
                field_type="Check"
                doc={{ check_all: areAllSelected }}
                onChange={selectAllItems}
              />
            )}
          </TableHeader>
          {doctypeListFields.map(({ label }) => (
            <TableHeader key={label}>{label}</TableHeader>
          ))}
          <TableHeader></TableHeader>
          <TableHeader></TableHeader>
        </TableRow>

        {state.length > 0 &&
          state.map((data, index) => (
            <TableRow key={`${index}-${data.name}`} data-name={data.name}>
              <TableColumn>
                {doctypePermissions.delete && (
                  <Input
                    field_name={`check_${index}`}
                    field_type="Check"
                    doc={{ [`check_${index}`]: selectedItems[index] }}
                    onChange={selectItem.bind(null, index)}
                  />
                )}
              </TableColumn>
              {doctypeListFields.map(
                ({ bold, field_name, field_type, options }, index) => {
                  let value = data[field_name];

                  if (field_type === "Link" || field_type === "Table Link") {
                    const [, title] = options.split(" | ");
                    value = data[field_name][title];
                  }

                  return (
                    <TableColumn key={`${index}-${field_name}`}>
                      <Span bold={bold}>
                        {index === 0 ? (
                          <StyledLinkA
                            to={`/desk/Form/${doctype}/${data.name}`}
                          >
                            {value}
                          </StyledLinkA>
                        ) : field_type === "Check" ? (
                          value ? (
                            <StyledIcon icon="check" color="#8D99A6" />
                          ) : (
                            <StyledIcon icon="square" color="#EEEEEE" />
                          )
                        ) : (
                          value
                        )}
                      </Span>
                    </TableColumn>
                  );
                }
              )}

              <TableColumn style={{ color: "#8d99a6", textAlign: "right" }}>
                <Span>
                  <StyledLinkB to={`/desk/Form/${doctype}/${data.name}`}>
                    {data.name}
                  </StyledLinkB>
                </Span>
              </TableColumn>

              <TableColumn style={{ color: "#8d99a6", textAlign: "right" }}>
                <Span>{moment(data.updated_at).locale("es").fromNow()}</Span>
              </TableColumn>
            </TableRow>
          ))}

        {state.length === 0 ? (
          <Message>
            <Text>No se encontraron {doctypeData.caption.toLowerCase()}</Text>
            <Button bgColor="#0057a6" color="#fff" onClick={redirectToForm}>
              Crear Nuevo
            </Button>
          </Message>
        ) : null}
      </Table>

      <Buttons>
        <LimitButton onClick={loadMore.bind(null, 20)} active={limit === 20}>
          20
        </LimitButton>
        <LimitButton onClick={loadMore.bind(null, 100)} active={limit === 100}>
          100
        </LimitButton>
        <LimitButton onClick={loadMore.bind(null, 500)} active={limit === 500}>
          500
        </LimitButton>
      </Buttons>
    </Container>
  );
};

export default ListView;
