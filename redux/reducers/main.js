import * as t from "../types";

const main = (
  state = {
    socket: null,
  },
  action
) => {
  switch (action.type) {
    case t.SET_SOCKET:
      return {
        ...state,
        socket: action.payload,
      };
    default:
      return { ...state };
  }
};

export default main;
