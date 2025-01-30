const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{
        .preferred_optimize_mode = .Debug,
    });

    const wasm = b.addExecutable(.{
        .name = "agent",
        .root_source_file = b.path("src/agent_wasm.zig"),
        .target = b.resolveTargetQuery(.{
            .os_tag = .freestanding,
            .cpu_arch = .wasm32,
        }),
        .optimize = optimize,
    });
    wasm.rdynamic = true;
    wasm.entry = .disabled;
    wasm.linkLibC();
    wasm.addIncludePath(b.path("libs"));
    wasm.addCSourceFile(.{ .file = b.path("src/stb_shim.c") });
    wasm.root_module.addCMacro("AGENT_WASM", "");

    const agent_test = b.addTest(.{
        .name = "Agent test",
        .root_source_file = b.path("src/agent.zig"),
        .target = target,
        .optimize = optimize,
    });
    agent_test.linkLibC();
    agent_test.addIncludePath(b.path("libs"));
    agent_test.addCSourceFile(.{ .file = b.path("src/stb_shim.c") });

    const ins_agent_test = b.addRunArtifact(agent_test);

    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&ins_agent_test.step);

    b.installArtifact(wasm);
}
