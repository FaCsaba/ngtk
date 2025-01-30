const std = @import("std");
const fmt = std.fmt;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const HashMap = std.AutoHashMap;

const tt = @cImport(@cInclude("stb/stb_truetype.h"));
const FontInfo = tt.stbtt_fontinfo;
const PackContext = tt.stbtt_pack_context;
const PackRange = tt.stbtt_pack_range;
const PackedChar = tt.stbtt_packedchar;
const init_font = tt.stbtt_InitFont;
const pack_begin = tt.stbtt_PackBegin;
const pack_font_ranges = tt.stbtt_PackFontRanges;
const pack_end = tt.stbtt_PackEnd;
const get_font_v_metrics = tt.stbtt_GetFontVMetrics;
const scale_for_mapping_em_to_pixels = tt.stbtt_ScaleForMappingEmToPixels;
const point_size = tt.STBTT_POINT_SIZE;
const get_font_bounding_box = tt.stbtt_GetFontBoundingBox;
const find_glyph_index = tt.stbtt_FindGlyphIndex;
const get_glyph_box = tt.stbtt_GetGlyphBox;
const pack_set_skip_missing_codepoints = tt.stbtt_PackSetSkipMissingCodepoints;

const AgentError = error{
    InitFontFailed,
    FontNotFound,
    Packing,
    BitmapNotLoaded,
    IncorrectUnicode,
};

const Point = struct {
    x: i32 = 0,
    y: i32 = 0,
};

const BoundingBox = struct {
    start: Point = .{},
    end: Point = .{},
};

const ExtPackedChar = struct {
    packed_char: PackedChar,
    glyph_index: i32,
    codepoint: u21,
};

pub const Font = struct {
    font_info: FontInfo,
    packed_chars: HashMap(u21, ExtPackedChar),
    atlas: []u8,
    atlas_size: Point,
    scale: f32,
    ascent: i32,
    descent: i32,
    baseline: i32,
    vert_adv: i32,
    bounding_box: BoundingBox,
};

pub const Agent = struct {
    allocator: Allocator,
    font: ?Font,
    fallback_font: Font,
    font_size: f32 = 12,

    pub fn init(allocator: Allocator) !*Agent {
        const a = try allocator.create(Agent);
        a.allocator = allocator;
        a.font_size = 24;
        a.font = null;
        return a;
    }

    fn load_font_adv(self: *Agent, buf: []const u8, unicode_start: i32, num_chars: i32) !Font {
        var font_info: FontInfo = undefined;

        if (init_font(&font_info, buf.ptr, 0) == 0) {
            return AgentError.InitFontFailed;
        }

        const scale = scale_for_mapping_em_to_pixels(&font_info, self.font_size);

        const glyph_idxs = try self.allocator.alloc(i32, @intCast(num_chars));
        defer self.allocator.free(glyph_idxs);
        var x: i32 = 0;
        var i: i32 = 0;
        while (i < num_chars) {
            const glyph_index = find_glyph_index(&font_info, unicode_start + i);
            glyph_idxs[@intCast(i)] = glyph_index;
            var start_x: c_int = 0;
            var end_x: c_int = 0;
            const got_glyph_box = get_glyph_box(&font_info, glyph_index, &start_x, 0, &end_x, 0);
            if (got_glyph_box == 1 and glyph_index != 0) {
                x += @intFromFloat(@round(@as(f32, @floatFromInt(end_x - start_x)) * scale * 1.5));
            }
            i += 1;
        }

        var bounding_box: BoundingBox = .{};
        get_font_bounding_box(&font_info, &bounding_box.start.x, &bounding_box.start.y, &bounding_box.end.x, &bounding_box.end.y);

        const char_size = Point{
            .x = x,
            .y = @intFromFloat(@round(@as(f32, @floatFromInt(bounding_box.end.y - bounding_box.start.y)) * scale)),
        };
        const atlas_size = Point{ .x = char_size.x, .y = char_size.y };

        var ctx: PackContext = undefined;
        const packed_chars_array = try self.allocator.alloc(PackedChar, @intCast(num_chars));
        defer self.allocator.free(packed_chars_array);
        const atlas = try self.allocator.alloc(u8, @intCast(atlas_size.x * atlas_size.y));
        pack_set_skip_missing_codepoints(&ctx, 1);
        if (pack_begin(
            &ctx,
            atlas.ptr,
            atlas_size.x,
            atlas_size.y,
            0,
            0,
            null,
        ) == 0) return AgentError.Packing;

        var range = PackRange{
            .font_size = point_size(self.font_size),
            .first_unicode_codepoint_in_range = unicode_start,
            .num_chars = num_chars,
            .chardata_for_range = packed_chars_array.ptr,
        };
        if (pack_font_ranges(
            &ctx,
            font_info.data,
            0,
            &range,
            1,
        ) == 0) return AgentError.Packing;

        pack_end(&ctx);

        var packed_chars = HashMap(u21, ExtPackedChar).init(self.allocator);
        i = 0;
        while (i < packed_chars_array.len) {
            const codepoint = unicode_start + i;
            const packed_char = packed_chars_array[@intCast(i)];
            const packed_char_ext: ExtPackedChar = .{
                .codepoint = @intCast(codepoint),
                .glyph_index = glyph_idxs[@intCast(i)],
                .packed_char = packed_char,
            };
            try packed_chars.put(@intCast(codepoint), packed_char_ext);
            i += 1;
        }

        var ascent: i32 = undefined;
        var descent: i32 = undefined;
        var line_gap: i32 = undefined;
        get_font_v_metrics(&font_info, &ascent, &descent, &line_gap);

        const font = Font{
            .font_info = font_info,
            .packed_chars = packed_chars,
            .atlas = atlas,
            .atlas_size = atlas_size,
            .bounding_box = bounding_box,
            .scale = scale,
            .ascent = ascent,
            .descent = descent,
            .baseline = @intFromFloat(@round(@as(f32, @floatFromInt(ascent)) * scale)),
            .vert_adv = ascent - descent + line_gap,
        };

        return font;
    }

    pub fn load_font(self: *Agent, buf: []const u8) !Font {
        if (self.font) |font| self.unload_font(font);
        const font = try self.load_font_adv(buf, 1, 256);
        self.font = font;
        return font;
    }

    pub fn unload_font(self: *Agent, font: Font) void {
        var chars = font.packed_chars;
        chars.deinit();
        self.allocator.free(font.atlas);
    }

    // pub fn write_character(self: *Agent, str: []const u8) !void {
    //     _ = self.font orelse return AgentError.FontNotFound;
    //     const str_view = std.unicode.Utf8View.init(str) catch return AgentError.IncorrectUnicode;
    //     var str_iter = str_view.iterator();
    //     while (str_iter.nextCodepoint()) |codepoint| {
    //         std.debug.print("{u} ", .{codepoint});
    //     }
    // }

    pub fn deinit(self: *Agent) void {
        if (self.font) |font| self.unload_font(font);
        self.allocator.destroy(self);
    }
};

test "Agent" {
    const stbi_write_png = @cImport(@cInclude("stb/stb_image_write.h")).stbi_write_png;
    const alloc = std.testing.allocator;

    const agent = try Agent.init(alloc);
    defer agent.deinit();

    const font_data = @embedFile("./DigitaltsLime.ttf");

    const font = try agent.load_font(font_data);

    const img_size = font.atlas_size;
    _ = stbi_write_png("font.png", img_size.x, img_size.y, 1, font.atlas.ptr, 0);
}
