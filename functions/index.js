const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const database = admin.database()
const firestore = admin.firestore()

exports.onCharacterStatusChanged = functions.database.ref('game/characters/{id}/status').onUpdate(async (change, context) => {
  const eventStatus = change.after.val()
  const userStatusFirestoreRef = firestore.doc(`characters/${context.params.id}`)
  const statusSnapshot = await change.after.ref.once('value')
  const status = statusSnapshot.val()

  if (status.updatedAt > eventStatus.updatedAt) {
    return null
  }

  eventStatus.updatedAt = new Date(eventStatus.updatedAt)

  return userStatusFirestoreRef.update({ active: eventStatus.active })
})

// exports.onCharacterCreated = functions.firestore.document('characters/{id}').onCreate((change, context) => {
//   database.ref(`game/characters/${context.params.id}`).update({
//     direction: 'right',
//     id: context.params.id,
//     ownerID: context.auth.uid,
//     status: {
//       active: false,
//       updatedAt: admin.database.ServerValue.TIMESTAMP,
//     },
//     x: 0,
//     y: 0,
//   })
// })
