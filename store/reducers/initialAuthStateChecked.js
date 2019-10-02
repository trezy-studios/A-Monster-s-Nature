import actionTypes from '../actionTypes'
import initialState from '../initialState'





export default function currentUserReducer (state = initialState.initialAuthStateChecked, action) {
  const { type } = action

  if (type === actionTypes.GET_CURRENT_USER) {
    return true
  }

  return state
}
