using UnrealBuildTool;

public class YilanRedline : ModuleRules
{
    public YilanRedline(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new string[] {
            "Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput",
            "ChaosVehicles", "NavigationSystem", "AIModule"
        });
    }
}
