using UnrealBuildTool;
using System.Collections.Generic;
public class YilanRedlineEditorTarget : TargetRules
{
    public YilanRedlineEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        ExtraModuleNames.Add("YilanRedline");
    }
}
