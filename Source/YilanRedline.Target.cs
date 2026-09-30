using UnrealBuildTool;
using System.Collections.Generic;
public class YilanRedlineTarget : TargetRules
{
    public YilanRedlineTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        ExtraModuleNames.Add("YilanRedline");
    }
}
