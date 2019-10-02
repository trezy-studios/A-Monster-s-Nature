// Module imports
import {
  bindActionCreators,
  createStore,
  applyMiddleware,
} from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { connect } from 'react-redux'
import thunkMiddleware from 'redux-thunk'





// Local imports
import {
  // firebase,
  firebaseApp,
} from '../helpers/firebase'
import * as gameActions from './actions/game'
import * as usersActions from './actions/users'
import actionTypes from './actionTypes'
import initialState from './initialState'
import reducer from './reducers'





let store = null

const actions = {
  ...gameActions,
  ...usersActions,
}

const initStore = (state = initialState) => {
  if (!store) {
    store = createStore(reducer, state, composeWithDevTools(applyMiddleware(thunkMiddleware)))

    if (typeof window !== 'undefined') {
      const { dispatch } = store

      const firebaseAppAuth = firebaseApp.auth()

      firebaseAppAuth.onAuthStateChanged(user => {
        dispatch({
          payload: user,
          status: 'success',
          type: actionTypes.GET_CURRENT_USER,
        })
      })
    }
  }

  return store
}





const connectDecorator = target => {
  const {
    mapDispatchToProps: mDTP,
    mapStateToProps,
    mergeProps,
    reduxOptions,
  } = target
  let mapDispatchToProps = mDTP

  if (Array.isArray(mDTP)) {
    mapDispatchToProps = dispatch => bindActionCreators(
      mDTP.reduce((acc, actionName) => ({
        ...acc,
        [actionName]: actions[actionName],
      }
      ), {}),
      dispatch
    )
  }

  return connect(
    mapStateToProps || (() => ({})),
    mapDispatchToProps || {},
    mergeProps,
    reduxOptions
  )(target)
}





const getActionCreators = (action, dispatch) => {
  let resolvedAction = action

  if (Array.isArray(action) && typeof action[0] === 'string') {
    resolvedAction = action.reduce((acc, actionName) => ({
      ...acc,
      [actionName]: actions[actionName],
    }), {})
  }

  if (typeof action === 'string') {
    resolvedAction = actions[action]
  }

  return bindActionCreators(resolvedAction, dispatch)
}





export {
  actions,
  actionTypes,
  getActionCreators,
  connectDecorator as connect,
  initStore,
}
