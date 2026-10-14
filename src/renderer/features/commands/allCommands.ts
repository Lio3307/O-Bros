import { APP_COMMANDS } from './appCommands'
import type { AppCommand } from './commandTypes'
import { GIT_COMMANDS } from './gitCommands'
import { NAVIGATION_COMMANDS } from './navigationCommands'
import { TERMINAL_COMMANDS } from './terminalCommands'

export const ALL_COMMANDS: AppCommand[] = [
  ...TERMINAL_COMMANDS,
  ...GIT_COMMANDS,
  ...NAVIGATION_COMMANDS,
  ...APP_COMMANDS
]
