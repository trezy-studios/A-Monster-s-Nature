import actionTypes from '../actionTypes'
import initialState from '../initialState'





export default function usersReducer (state = initialState.users, action) {
  const {
    payload,
    status,
    type,
  } = action

  switch (type) {
    case actionTypes.GET_CURRENT_USER:
      switch (status) {
        case 'success':
          if (payload) {
            return {
              ...state,
              [payload.uid]: payload,
            }
          }

          return state

        default:
          return state
      }

    default:
      return state
  }
}
