// Module imports
import Link from 'next/link'
import React from 'react'





// Local imports
import PageWrapper from '../components/PageWrapper'





/* eslint-disable id-length,no-magic-numbers,no-param-reassign,react-hooks/rules-of-hooks */
const Home = () => (
  <PageWrapper
    description="Blorp"
    title="Home">
    <div className="hero">
      <h2>Join the World of Kolo Tera</h2>

      <p><em>A Monster’s Nature</em> is about a world inhabited by the intelligent ancestries (humans, elves, dwarves, orcs, birdfolk (tbd), catfolk (tbd), et al), who fight alongside their tamed companions to defeat the evils that inhabit their planet.</p>

      <p>While players will create a fairly standard character by RPG standards (dwarven clerics, orcish warriors, etc), the core game mechanics will revolve around taming and training companions to fight alongside you. Taming will be accomplished by working to understand the nature of a creature (via combat, exploratory quests into the creatures’ habitat, etc), then performing a set of tasks to gain the creature’s trust. Once a creature has been tamed, it becomes one of the player’s companions and can be used to assist the player in combat.</p>

      <p>Tamed companions will offer a wide variety of benefits. While all companions will be able to assist in combat, some will be better fighters than others. Those that are not capable fighters may make up for their deficiencies by providing healing to the player and their teammates, buffing the player, or debuffing their opponents.</p>

      <menu type="toolbar">
        <Link href="/play">
          <a className="button primary">
            Play now!
          </a>
        </Link>
      </menu>
    </div>
  </PageWrapper>
)





export default Home
