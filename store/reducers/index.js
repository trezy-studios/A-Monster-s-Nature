import { combineReducers } from 'redux'
import currentUserID from './currentUserID'
import game from './game'
import initialAuthStateChecked from './initialAuthStateChecked'
import users from './users'





export default combineReducers({
  currentUserID,
  game,
  initialAuthStateChecked,
  users,
})
