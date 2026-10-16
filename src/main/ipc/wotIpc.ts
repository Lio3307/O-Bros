import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { installSkill, listSkillTargets, refreshWotInstalled, removeSkill } from '../services/wot/skillInstaller'
import { normalizeTeamPolicy } from '../../shared/teamPolicy'
import { availableAgents, closeMemberById, listMembers, setTeamPolicy, stopAllMembers } from '../services/wot/teamRegistry'
import { receiveInterfaceAnswer } from '../services/wot/rendererBridge'

export function registerWotIpc(): void {
  ipcMain.handle(IpcChannel.wotListMembers, () => listMembers())
  ipcMain.handle(IpcChannel.wotCloseMember, (_event, memberId: string) => closeMemberById(memberId))
  ipcMain.on(IpcChannel.wotRespond, (_event, requestId: string, answer: unknown, errorMessage: string | null) =>
    receiveInterfaceAnswer(requestId, answer, errorMessage)
  )
  ipcMain.handle(IpcChannel.wotSkillTargets, () => listSkillTargets())
  ipcMain.handle(IpcChannel.wotInstallSkill, (_event, targetId: string) => installSkill(targetId))
  ipcMain.handle(IpcChannel.wotSetPolicy, (_event, policy: unknown) => setTeamPolicy(normalizeTeamPolicy(policy)))
  ipcMain.handle(IpcChannel.wotStopAll, () => stopAllMembers())
  ipcMain.handle(IpcChannel.wotAgents, () => availableAgents())
  ipcMain.handle(IpcChannel.wotIsInstalled, () => refreshWotInstalled())
  ipcMain.handle(IpcChannel.wotRemoveSkill, (_event, targetId: string) => removeSkill(targetId))
}
