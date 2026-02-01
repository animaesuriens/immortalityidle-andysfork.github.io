/**
 * Centralized tooltip definitions for the game.
 * Import and use these constants to ensure consistent tooltip text across components.
 */

import {
  BASE_LIFESPAN_YEARS,
  MAX_BASE_LIFESPAN_YEARS,
  DAYS_PER_LIFESPAN_BONUS,
  STARVATION_DAMAGE_PERCENT,
  STARVATION_DAMAGE_MIN,
  STARVATION_SPIRITUALITY_GAIN,
  SPIRIT_PROJECTION_QI_COST,
} from './character';

// =============================================================================
// PANEL HELP TOOLTIPS (help icons on each panel header)
// =============================================================================

export const PANEL_HELP = {
  health: `Maintaining your health is an important part of becoming immortal.

If your health reaches 0, you will die and need to try for immortality once you are reincarnated in your next life.`,

  equipment: `You will need to arm yourself with weapons and protective gear if you want to fight through the many battles that await you on your journey to immortality.

Legends even speak of extraordinary cultivators who can combine items of the same type to produce even stronger equipment.

Watch out, each piece of gear will take damage with use and you will need to constantly improve it to keep it strong.`,

  inventory: `The items that you gain during your quest for immortality will appear here.

Hover your cursor over an item to learn more about it.`,

  time: `Achieving immortality doesn't happen overnight. It takes lifetimes of hard work.

Choose how to schedule your days to take care of your basic needs and develop your immortal potential. Click the schedule button on activities or drag them here to put them on your schedule.

When you allow time to move forward, you will perform each activity in your schedule in the order it is listed. You can move scheduled activities around or repeat activities over multiple days.

Don't forget to schedule some rest too! You'll need to take a break now and then in your journey toward immortality.`,

  activities: `Choose activities to add to your schedule.

At first you'll only know how to do a few things, but as you develop your attributes more options will become available.`,

  battle: `Monsters come out at night.

You'll need to be strong enough to fight them off if you want to become an immortal.`,

  attributes: `Your attributes define your growing immortal characteristics.

You can grow your attributes through the activities that you choose. Aptitudes that you developed in your past lives can make it easier to develop attributes in your current life.`,

  followers: `Your followers can aid you in many ways. Each has a specific skill that they will use to your benefit.

Followers must be taken care of, so having them will cost you some money each day, and more powerful followers will have more expensive needs you will have to take care of.`,

  pets: `Your pets can aid you in many ways.

Each has a specific skill that they will use to your benefit.`,

  home: `Your home is an essential part of your life.

A better home allows you to recover and has room for furniture that can aid your immortal development.`,

  log: `A record of the events that lead you to immortality will surely be of interest to those who sing your legend in the ages to come.

You can filter out the events that are less interesting to you in the present.`,

  portals: 'Take a portal to a different plane of existence.',
};

// =============================================================================
// TOP BAR UI TOOLTIPS
// =============================================================================

export const TOP_BAR = {
  help: 'Confused? Click here.',
  statistics: 'Statistics!',
  manualStore: 'A store that sells special manuals for aspiring immortals.',
  options: 'Options. Lots of them.',
  achievements: 'Achievements!',
  impossibleTasks: 'Impossible Tasks',
  ascension: 'Ascension Techniques.',
  save: 'The game autosaves every few minutes, but click here to manually save right now.',
  load: 'Load the last saved game.',
  credits: 'Who made this awesome free game?',
  reincarnate: 'Voluntarily end this life, allowing your current attributes to strengthen your aptitudes in the next life.',
  discord: 'Have questions? Try the Immortality Idle Discord.',
};

// =============================================================================
// STATUS TOOLTIPS (base descriptions, dynamic parts built by functions)
// =============================================================================

export const STATUS = {
  health: {
    name: 'Health',
    description: 'If this reaches 0, you die.',
  },
  stamina: {
    name: 'Stamina',
    description: 'Used by activities.\nRegenerates when resting.',
  },
  qi: {
    name: 'Qi',
    description: 'Spiritual energy used for cultivation techniques.',
    locked: 'Qi is not yet unlocked.',
  },
  nourishment: {
    name: 'Nutrition',
    description: 'Decreases by 1 each day.\n\nWhen empty:',
    starvationWithSpirituality: [
      `Take ${STARVATION_DAMAGE_PERCENT * 100}% health as starvation damage (min ${STARVATION_DAMAGE_MIN})`,
      `Gain ${STARVATION_SPIRITUALITY_GAIN} spirituality`,
    ],
    starvationWithoutSpirituality: 'You starve to death',
  },
};

// =============================================================================
// COMBAT TOOLTIPS
// =============================================================================

export const COMBAT = {
  accuracy: 'Accuracy',
  attackPower: 'Attack Power',
  defense: 'Defense',
  accuracyFull: `Accuracy

Your chance to hit monsters when you attack them.
Based on your speed.`,

  attackPowerFull: `Attack Power

The damage you will do when you hit a monster.
Based on your strength and weapons.`,

  defenseFull: `Defense

Reduces damage when a monster hits you.
Based on your toughness and armor.`,

  righteousWrathSuffix: '\n\nDoubled by the power of your righteous wrath.',

  lookForTrouble: `Did you need more trouble in your life?

If you don't have a monster to fight, get one.
Be careful, they get stronger as they go.`,
};

// =============================================================================
// TIME PANEL TOOLTIPS
// =============================================================================

export const TIME_PANEL = {
  pause: `Pause the game.

Hotkey: Alt-0 to pause or spacebar to toggle.

Clicking this again while paused will step time forward a single day.
When paused, you can also advance one day by pressing the Enter key.`,

  slowSpeed: 'Slow Game Speed (1 day/sec).\nHotkey: Alt-1',
  standardSpeed: (tps: string) => `Standard Game Speed (${tps} days/sec).\nHotkey: Alt-2`,
  fastSpeed: (tps: string) => `Fast Game Speed (${tps} days/sec).\nHotkey: Alt-3`,
  fasterSpeed: (tps: string) => `Faster Game Speed (${tps} days/sec).\nHotkey: Alt-4`,
  fastestSpeed: (tps: string) => `Fastest Game Speed (${tps} days/sec).\nHotkey: Alt-5`,
  options: 'Options',

  spiritProjection: `You can project your spiritual self to take on a second activity while your physical body continues its work.

Whatever activity you drop here will be completed each day as long as you have enough qi to support the effort.

Requires ${SPIRIT_PROJECTION_QI_COST} qi in addition to the regular requirements of the activity.`,

  removeActivity: 'Remove this activity from the schedule.',
  disableActivity: 'Disable this activity on the schedule.',

  minusDays: `Spend fewer days on this.

Shift- or Ctrl-click to remove 10x
Shift-Ctrl-click to remove 100x`,

  plusDays: `Spend more days on this.

Shift- or Ctrl-click to add 10x
Shift-Ctrl-click to add 100x`,
};

// =============================================================================
// ACTIVITY TOOLTIPS
// =============================================================================

export const ACTIVITY = {
  apprenticeship: `This activity requires that you go through an apprenticeship.

You can only do one apprenticeship in each lifetime, so choose carefully what trade you want to learn.

Once you've started, other trades may be closed off until your next life.`,

  lastIncome: (amount: string) =>
    `Exactly how much will you make doing this job?

It can depend on your attributes, but the last time you did this job you made ${amount} taels.`,

  whatIsThis: 'What is this activity?\nClick to learn all about it!',
  takePortal: 'Take this portal',
};

// =============================================================================
// INVENTORY TOOLTIPS
// =============================================================================

export const INVENTORY = {
  hellMoney: 'Money accepted as legal tender in hell.',

  sort: `Click to sort your inventory.
Shift-click to toggle autosort.
Ctrl-click to toggle descending.`,

  sell: (itemName: string, value: number) =>
    `Sell one ${itemName} for ${value} taels.

Right-click items to sell.`,

  sellStack: (itemName: string, totalValue: string) =>
    `Sell all the ${itemName} in this inventory slot for ${totalValue} taels.

Shift-right-click items to sell the stack.`,

  sellAll: (itemName: string) => `Sell all the ${itemName} in the whole inventory.`,

  autoSell: `Automatically sell this kind of item whenever you get one.

You can change this in the options menu later if you change your mind.

Ctrl-right-click items to autosell.`,

  use: (useLabel: string, useDescription: string) =>
    `${useLabel}. ${useDescription}

Shift-click items to use them.
Shift-click or Ctrl-click this button to use more of them.`,

  autoUse: (useLabel: string, useDescription: string) =>
    `Auto-${useLabel}. ${useDescription}

You can change this in the options menu later if you change your mind.

Ctrl-click items to auto-use.`,

  autoBalance: `Balance between automatically using and selling this item.

You can change this in the options menu later if you change your mind.`,

  equip: 'Equip this.\nDouble-click weapons or armor to equip.',
  mergeSpiritGem: 'Merge 10 of these into a higher grade gem.',
  throwAway: 'Throw this stack of items away.',

  noFood: {
    hell: 'You have no food, and no one in hell sells rice.',
    autoBuy: (cost: number) =>
      `You have no food in your inventory.

You will spend ${cost} tael per day on a bowl of rice to avoid starvation.`,
    noAutoBuy: `You have no food in your inventory and have chosen not to buy food to prevent starvation.`,
  },
};

// =============================================================================
// EQUIPMENT TOOLTIPS
// =============================================================================

export const EQUIPMENT = {
  slotLock: (isLocked: boolean) => `Click to ${isLocked ? 'unlock' : 'lock'} this slot`,
};

// =============================================================================
// HOME PANEL TOOLTIPS
// =============================================================================

export const HOME = {
  emptyFurnitureSlot: (slotName: string) =>
    `You don't own a ${slotName}, but your home could hold one.`,

  viewFarm: 'View your farm.',

  buyLand: (price: string, price10: string, price100: string, halfCount: number) =>
    `Click to buy a plot of land for ${price} taels.
Shift-click to buy 10 plots for ${price10} taels.
Ctrl+Shift-click to buy 100 plots for ${price100} taels.
Ctrl-click to buy ${halfCount} plots (half the land you can afford).`,

  resetFields: `Reset all fields.

Clears all fields and replants the same number with fresh crops.`,

  upgradingHome: 'Upgrading your home.',

  mouseWarning: `Tent living is rough.

All these pesky mice could become a real problem. You might want to buy some land and get a better home.`,
};

// =============================================================================
// LIFESPAN TOOLTIP
// =============================================================================

export const LIFESPAN = {
  template: (
    baseYears: number,
    baseDays: number,
    totalYearsLived: string,
    totalDaysLived: string,
    bonusYears: number,
    bonusDays: number
  ) =>
    `Your base lifespan is ${baseYears} years and ${baseDays} days.

It starts at ${BASE_LIFESPAN_YEARS} years and increases by 1 day for every ${DAYS_PER_LIFESPAN_BONUS / 365} years lived across all lives, up to a maximum of ${MAX_BASE_LIFESPAN_YEARS} years.

Years Lived: ${totalYearsLived} years and ${totalDaysLived} days.

Current Bonus: ${bonusYears} years and ${bonusDays} days.`,
};

// =============================================================================
// YIN YANG TOOLTIP
// =============================================================================

export const YIN_YANG = {
  template: (yang: string, yin: string, balanceString: string) =>
    `Yang: ${yang}
Yin: ${yin}

Your balance is ${balanceString}.`,
};

// =============================================================================
// OPTIONS MODAL TOOLTIPS
// =============================================================================

export const OPTIONS = {
  easyMode: `This game is much too hard and takes much too long to play to the end.

Click this to make it easier and allow you to rush through the game.

Be warned: you will forever be known as a cultivator who took the easy path to immortality.`,

  backgroundMusic:
    'Enable background music.\n\n(This also allows the game to run in the background more efficiently.)',

  reincarnate: `Voluntarily end this life.

Your current attributes will strengthen your aptitudes in the next life.`,

  manualSave: `Click to save your game now.
Shift-click for save options.
Ctrl-shift-click to load backup save.`,

  hardReset: 'Completely restart your journey toward immortality.',
};

// =============================================================================
// FOLLOWERS TOOLTIPS
// =============================================================================

export const FOLLOWERS = {
  manage: 'Manage your followers.',
  managePets: 'Manage your pets.',

  followerInfo: (
    name: string,
    power: number,
    job: string,
    jobDescription: string,
    yearsServed: string,
    yearsRemaining: string,
    dailyCost: string
  ) =>
    `${name} is a level ${power} ${job}.
${jobDescription}

${name} has followed you for ${yearsServed} years and will serve for another ${yearsRemaining} more years.

Daily cost: ${dailyCost}`,

  dismissFollower: 'Dismiss this follower.',

  dismissFollowerAdvanced: `Dismiss this follower.

Shift-click to automatically dismiss everyone of this job type.
Ctrl-click to set the current number as the limit without dismissing.`,

  dismissPet: 'Dismiss this pet.',

  dismissPetAdvanced: `Dismiss this pet.

Shift-click to automatically dismiss every pet of this type.
Ctrl-click to set the current number as the limit without dismissing.`,
};

// =============================================================================
// LOG PANEL TOOLTIPS
// =============================================================================

export const LOG = {
  manageFilters: 'Manage Log Filters',
};

// =============================================================================
// BATTLE OPTIONS TOOLTIPS
// =============================================================================

export const BATTLE = {
  options: 'Options',
};
