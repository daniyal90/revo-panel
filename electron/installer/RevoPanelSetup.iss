[Setup]
AppName=Revo Panel
AppVersion=1.0.0
DefaultDirName={pf}\Revo Panel
DefaultGroupName=Revo Panel
OutputBaseFilename=RevoPanelSetup
Compression=lzma
SolidCompression=yes

[Files]
Source: "..\nextjs-app\dist\**\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Icons]
Name: "{group}\Revo Panel"; Filename: "{app}\RevoPanel.exe"
Name: "{commondesktop}\Revo Panel"; Filename: "{app}\RevoPanel.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked

[Code]
var
  BannerBmpPath: string;

procedure InitializeWizard();
begin
  WizardForm.Caption := 'Revo Panel Setup - Admin Console';
  WizardForm.StatusLabel.Caption := 'Preparing installation...';
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  case CurStep of
	ssInstall:
	  begin
		WizardForm.StatusLabel.Caption := 'Extracting application core...';
	  end;
	ssPostInstall:
	  begin
		WizardForm.StatusLabel.Caption := 'Registering background SMS gateways...';
	  end;
  end;
end;

[Run]
Filename: "{app}\RevoPanel.exe"; Description: "Launch Revo Panel"; Flags: nowait postinstall skipifsilent

[SetupMessage]
; Footer text not directly supported—use custom page or include in banner image. Including copyright in messages.
; Use banner image named banner.png placed in resources and loaded in InitializeWizard if desired.
