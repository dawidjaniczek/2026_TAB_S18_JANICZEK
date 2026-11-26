import type { AuthUser } from "../../types/api";
import { BookingsPanel } from "./BookingsPanel";
import { ClientsPanel } from "./ClientsPanel";
import {
  AccountPanel,
  AttendancePanel,
  ContractsPanel,
  InfoPanel,
} from "./ExtraPanels";
import { GroupsPanel } from "./GroupsPanel";
import { PassesPanel } from "./PassesPanel";
import { ReportsPanel } from "./ReportsPanel";
import { SchedulePanel } from "./SchedulePanel";
import { UsersPanel } from "./UsersPanel";
import {
  MODULES_BY_ROLE,
  type DashboardModule,
  type ModuleId,
} from "./moduleConfig";

interface PanelViewProps {
  user: AuthUser;
  module: DashboardModule;
  onBack: () => void;
  onSelectModule: (module: DashboardModule) => void;
}

function renderModuleContent(moduleId: ModuleId, user: AuthUser) {
  const fullName = `${user.first_name} ${user.last_name}`;

  switch (moduleId) {
    case "users":
      return <UsersPanel />;
    case "groups":
      return <GroupsPanel heading="Wszystkie grupy pływackie" />;
    case "my-groups":
      return <GroupsPanel heading="Grupy pływackie" />;
    case "schedule":
      return <SchedulePanel canCreate />;
    case "instructor-schedule":
      return <SchedulePanel instructorFullName={fullName} />;
    case "my-sessions":
      return <SchedulePanel />;
    case "reports":
      return <ReportsPanel />;
    case "clients":
      return <ClientsPanel canCreate heading="Kartoteka kursantów" />;
    case "levels-notes":
      return <ClientsPanel heading="Poziomy i uwagi o kursantach" />;
    case "bookings":
      return <BookingsPanel />;
    case "passes":
      return <PassesPanel />;
    case "contracts":
      return <ContractsPanel />;
    case "attendance":
      return <AttendancePanel />;
    case "my-account":
      return <AccountPanel user={user} />;
    case "info":
      return <InfoPanel />;
  }
}

export function PanelView({
  user,
  module,
  onBack,
  onSelectModule,
}: PanelViewProps) {
  const roleModules = MODULES_BY_ROLE[user.role];

  return (
    <div className="module-view">
      <div className="module-toolbar">
        <button type="button" className="back-button" onClick={onBack}>
          ← Powrót do panelu głównego
        </button>

        <nav className="module-tabs" aria-label="Moduły panelu">
          {roleModules.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`module-tab ${item.id === module.id ? "active" : ""}`}
              onClick={() => onSelectModule(item)}
            >
              <span>{item.icon}</span>
              {item.title}
            </button>
          ))}
        </nav>
      </div>

      <div className="module-header">
        <div className="card-icon">{module.icon}</div>
        <div>
          <div className="welcome-label">MODUŁ SYSTEMU</div>
          <h1>{module.title}</h1>
          <p className="module-subtitle">{module.description}</p>
        </div>
      </div>

      {renderModuleContent(module.id, user)}
    </div>
  );
}
