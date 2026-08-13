import { AuthLoading } from './components/auth/AuthLoading'
import { LoginScreen } from './components/auth/LoginScreen'
import { MainPanel } from './components/layout/MainPanel'
import { Sidebar } from './components/layout/Sidebar'
import { ProfileModal } from './components/profile/ProfileModal'
import { useSajuApp } from './hooks/useSajuApp'
import './styles/app.css'

function App() {
  const app = useSajuApp()

  if (app.authLoading) {
    return <AuthLoading />
  }

  if (!app.user) {
    return (
      <LoginScreen onLogin={app.handleGoogleLogin} error={app.error} />
    )
  }

  return (
    <div className="layout">
      {app.profileModal && (
        <ProfileModal
          mode={app.profileModal}
          values={app.draft}
          onChange={app.setDraft}
          onSave={app.handleSaveProfileModal}
          onClose={app.closeProfileModal}
          saving={app.saving}
          error={app.modalError}
          nameRef={app.modalNameRef}
        />
      )}

      <Sidebar
        displayName={app.displayName}
        profile={app.profile}
        profileComplete={app.profileComplete}
        profileLoaded={app.profileLoaded}
        readings={app.readings}
        selectedId={app.selectedId}
        listError={app.listError}
        busy={app.busy}
        onEditProfile={() => app.openProfileModal('edit', app.profile)}
        onLogout={app.handleLogout}
        onNewSaju={app.handleNewSaju}
        onSelectReading={app.handleSelectReading}
      />

      <MainPanel
        isViewingSaved={app.isViewingSaved}
        profile={app.profile}
        displayName={app.displayName}
        profileComplete={app.profileComplete}
        profileLoaded={app.profileLoaded}
        busy={app.busy}
        loading={app.loading}
        saving={app.saving}
        canInterpret={app.canInterpret}
        canUpdateResult={app.canUpdateResult}
        error={app.error}
        toast={app.toast}
        result={app.result}
        resultRef={app.resultRef}
        resultKey={app.resultKey}
        onEditProfile={() => app.openProfileModal('edit', app.profile)}
        onNewSaju={app.handleNewSaju}
        onUpdate={app.handleUpdate}
        onDelete={app.handleDelete}
        onInterpret={app.handleInterpret}
      />
    </div>
  )
}

export default App
