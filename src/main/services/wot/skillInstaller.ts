import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { programOf } from '../../../shared/agentLaunchers'
import { expandSkillFolders, parseSkillFolderRules, type SkillFolderRule, type SkillPlace } from '../../../shared/skillFolders'
import { compareVersions, skillVersionOf } from '../../../shared/skillVersion'
import { listTeamAgents } from '../../../shared/teamAgents'
import type { WotSkillStatus, WotSkillTarget } from '../../../shared/types'
import { scanAccounts } from '../accountScanner'
import { loadAcpRegistry } from '../agents/acpRegistryClient'
import { listPathCommands } from '../agents/agentDetector'
import { WOT_SKILL_SOURCE_PATH } from './wotPaths'

const SKILL_FOLDERS_PATH = join(__dirname, '../../resources/agents/skill-folders.json')
const SKILL_FOLDER = 'wot'
const SKILL_FILE = 'SKILL.md'
const OWN_SKILL_MARK = 'name: wot'
const UNKNOWN_VERSION = '0.0.0'

let isInstalledSomewhere = false

function skillPathOf(place: SkillPlace): string {
  return join(place.skillsFolder, SKILL_FOLDER, SKILL_FILE)
}

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

async function loadRules(): Promise<SkillFolderRule[]> {
  const rulesText = await readIfExists(SKILL_FOLDERS_PATH)
  return parseSkillFolderRules(rulesText === null ? null : JSON.parse(rulesText))
}

async function listPlaces(): Promise<SkillPlace[]> {
  const [rules, accounts] = await Promise.all([loadRules(), scanAccounts()])
  return expandSkillFolders(rules, homedir(), accounts)
}

async function findPlace(targetId: string): Promise<SkillPlace> {
  const place = (await listPlaces()).find((candidate) => candidate.id === targetId)
  if (place === undefined) {
    throw new Error('That skill location is not known on this computer.')
  }
  return place
}

function statusOf(installedVersion: string | null, isInstalled: boolean, availableVersion: string): WotSkillStatus {
  if (!isInstalled) {
    return 'missing'
  }
  return compareVersions(installedVersion ?? UNKNOWN_VERSION, availableVersion) < 0 ? 'outdated' : 'installed'
}

async function readersByPlace(places: SkillPlace[]): Promise<Map<string, { names: string[]; command: string }>> {
  const [registryAgents, installedCommands, rules] = await Promise.all([loadAcpRegistry(), listPathCommands(), loadRules()])
  const installedAgents = listTeamAgents([], registryAgents, installedCommands).filter((agent) => agent.isInstalled)
  const dedicatedCommands = rules.flatMap((rule) => (rule.command === null ? [] : [rule.command]))
  const readers = new Map<string, { names: string[]; command: string }>()
  for (const place of places) {
    const matching = installedAgents.filter((agent) => {
      const program = programOf(agent.command)
      return place.command === null ? !dedicatedCommands.includes(program) : program === place.command
    })
    readers.set(place.id, {
      names: matching.map((agent) => agent.name),
      command: matching[0]?.command ?? place.command ?? ''
    })
  }
  return readers
}

export async function listSkillTargets(): Promise<WotSkillTarget[]> {
  const [places, source] = await Promise.all([listPlaces(), readFile(WOT_SKILL_SOURCE_PATH, 'utf8')])
  const availableVersion = skillVersionOf(source) ?? UNKNOWN_VERSION
  const readers = await readersByPlace(places)
  const targets = await Promise.all(
    places.map(async (place): Promise<WotSkillTarget> => {
      const installed = await readIfExists(skillPathOf(place))
      const isOwnSkill = installed !== null && installed.includes(OWN_SKILL_MARK)
      const installedVersion = isOwnSkill ? (skillVersionOf(installed) ?? UNKNOWN_VERSION) : null
      return {
        id: place.id,
        title: place.title,
        readBy: readers.get(place.id)?.names ?? [],
        iconCommand: readers.get(place.id)?.command ?? '',
        skillPath: skillPathOf(place),
        status: statusOf(installedVersion, isOwnSkill, availableVersion),
        installedVersion,
        availableVersion
      }
    })
  )
  isInstalledSomewhere = targets.some((target) => target.status !== 'missing')
  return targets
}

export async function refreshWotInstalled(): Promise<boolean> {
  const places = await listPlaces()
  const installed = await Promise.all(places.map((place) => readIfExists(skillPathOf(place))))
  isInstalledSomewhere = installed.some((text) => text !== null && text.includes(OWN_SKILL_MARK))
  return isInstalledSomewhere
}

export function isWotInstalled(): boolean {
  return isInstalledSomewhere
}

export async function installSkill(targetId: string): Promise<void> {
  const skillPath = skillPathOf(await findPlace(targetId))
  await mkdir(dirname(skillPath), { recursive: true })
  await writeFile(skillPath, await readFile(WOT_SKILL_SOURCE_PATH, 'utf8'))
  isInstalledSomewhere = true
}

export async function removeSkill(targetId: string): Promise<void> {
  const skillPath = skillPathOf(await findPlace(targetId))
  const installed = await readIfExists(skillPath)
  if (installed !== null) {
    if (!installed.includes(OWN_SKILL_MARK)) {
      throw new Error('The wot folder there was not written by O-BROS, so it was left alone.')
    }
    await rm(dirname(skillPath), { recursive: true, force: true })
  }
  await refreshWotInstalled()
}
