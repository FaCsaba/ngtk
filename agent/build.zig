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
    wasm.addCSourceFile(.{ .file = b.path("src/stb_wasm_shim.c") });

    b.installArtifact(wasm);

    const raylib_dep = b.dependency("raylib-zig", .{
        .target = target,
        .optimize = optimize,
    });

    const raylib = raylib_dep.module("raylib");
    const raylib_artifact = raylib_dep.artifact("raylib");

    const desktop = b.addExecutable(.{
        .name = "desktop",
        .root_source_file = b.path("src/desktop_app.zig"),
        .target = target,
        .optimize = optimize,
    });
    desktop.linkLibC();
    desktop.addIncludePath(b.path("libs"));
    desktop.addCSourceFile(.{ .file = b.path("src/stb_desktop_shim.c") });
    desktop.linkLibrary(raylib_artifact);
    desktop.root_module.addImport("raylib", raylib);

    b.installArtifact(desktop);

    const run_desktop = b.addRunArtifact(desktop);
    const run_desktop_step = b.step("run_desktop", "Run the desktop app");
    run_desktop_step.dependOn(&run_desktop.step);

    const test_record = b.addExecutable(.{
        .name = "tests",
        .root_source_file = b.path("src/tests.zig"),
        .target = target,
        .optimize = optimize,
    });
    test_record.linkLibC();
    test_record.addIncludePath(b.path("libs"));
    test_record.addCSourceFile(.{ .file = b.path("src/stb_desktop_shim.c") });

    b.installArtifact(test_record);

    const run_test_record = b.addRunArtifact(test_record);
    const run_test_record_step = b.step("record", "Record test cases");
    run_test_record_step.dependOn(&run_test_record.step);

    const agent_test = b.addTest(.{
        .name = "Tests",
        .root_source_file = b.path("src/tests.zig"),
        .target = target,
        .optimize = optimize,
    });
    agent_test.linkLibC();
    agent_test.addIncludePath(b.path("libs"));
    agent_test.addCSourceFile(.{ .file = b.path("src/stb_wasm_shim.c") });

    const ins_agent_test = b.addRunArtifact(agent_test);

    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&ins_agent_test.step);
}
