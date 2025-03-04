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
const get_glyph_kern_advance = tt.stbtt_GetGlyphKernAdvance;

const AgentError = error{
    InitFontFailed,
    FontNotFound,
    Packing,
    BitmapNotLoaded,
    IncorrectUnicode,
    CharacterNotFound,
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
    vert_adv: i32,
    bounding_box: BoundingBox,
};

const RENDERED_TEXT_WIDTH: i32 = 420;
const RENDERED_TEXT_HEIGHT: i32 = 420;

// TODO: Introduce fallback font for when the user types something unexpected,
//       Maybe allow chaning to their default ime.
// TODO: Find a way to render svgs with color.
pub const Agent = struct {
    allocator: Allocator,
    rendered_text: []u8,
    font: ?Font,
    font_size: f32 = 12,

    pub fn init(allocator: Allocator) !*Agent {
        const a = try allocator.create(Agent);
        a.allocator = allocator;
        a.rendered_text = try allocator.alloc(u8, RENDERED_TEXT_WIDTH * RENDERED_TEXT_HEIGHT);
        a.font_size = 24;
        a.font = null;

        for (a.rendered_text, 0..) |_, i| {
            a.rendered_text[i] = 0;
        }
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
        // TODO: Find a better way to figure out packing size. Maybe check if we failed packing and try again with a bigger array size.
        //       This might be why Firefox is failing.
        var x: i32 = 0;
        var i: i32 = 0;
        while (i < num_chars) {
            const glyph_index = find_glyph_index(&font_info, unicode_start + i);
            glyph_idxs[@intCast(i)] = glyph_index;
            var start_x: c_int = 0;
            var end_x: c_int = 0;
            const got_glyph_box = get_glyph_box(&font_info, glyph_index, &start_x, 0, &end_x, 0);
            if (got_glyph_box == 1 and glyph_index != 0) {
                x += @intFromFloat(@round(@as(f32, @floatFromInt(end_x - start_x)) * scale * 2));
            }
            i += 1;
        }

        var bounding_box: BoundingBox = .{};
        get_font_bounding_box(&font_info, &bounding_box.start.x, &bounding_box.start.y, &bounding_box.end.x, &bounding_box.end.y);

        // TODO: Atlas size should be based on number of characters and the fontsize somehow
        const atlas_size = Point{ .x = 1024, .y = 1024 };

        var ctx: PackContext = undefined;
        const packed_chars_array = try self.allocator.alloc(PackedChar, @intCast(num_chars));
        defer self.allocator.free(packed_chars_array);
        const atlas = try self.allocator.alloc(u8, @intCast(atlas_size.x * atlas_size.y));
        pack_set_skip_missing_codepoints(&ctx, 0);
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
            .vert_adv = ascent - descent + line_gap,
        };

        return font;
    }

    pub fn load_font(self: *Agent, buf: []const u8) !Font {
        if (self.font) |font| self.unload_font(font);
        const font = try self.load_font_adv(buf, 1, 1024);
        self.font = font;
        return font;
    }

    pub fn unload_font(self: *Agent, font: Font) void {
        var chars = font.packed_chars;
        chars.deinit();
        self.allocator.free(font.atlas);
    }

    pub fn render_text(self: *Agent, str: []const u8) !void {
        self.clear_rendered_text();

        const font = self.font orelse return AgentError.FontNotFound;
        const ascent = font.ascent;
        const scale = font.scale;
        const baseline = @as(f32, @floatFromInt(ascent)) * scale;

        var xpos: f32 = 10;
        const ypos: f32 = 10;

        const utf8_view = std.unicode.Utf8View.init(str) catch return AgentError.IncorrectUnicode;
        var utf8_iter = utf8_view.iterator();
        while (utf8_iter.nextCodepoint()) |char| {
            const packed_char = font.packed_chars.get(char) orelse return AgentError.CharacterNotFound; // TODO: Probably should just render the no character symbol at 0

            const xadv: f32 = packed_char.packed_char.xadvance;
            const xoff: f32 = packed_char.packed_char.xoff;
            const yoff: f32 = packed_char.packed_char.yoff;

            // TODO: When the character wouldn't fit place it in a new line.

            // HACK: I am unable to verify whether whitespaces are supposed to have some data in font files to identify
            //       them as such, or are text rendering engines in charge of knowing that.
            if (!isWhitespace(char)) {
                const xatlas_end = packed_char.packed_char.x1;
                const yatlas_end = packed_char.packed_char.y1;

                var yrender: i32 = @intFromFloat(ypos + baseline + yoff);
                var yatlas = packed_char.packed_char.y0;
                while (yatlas < yatlas_end) {
                    if (yrender >= RENDERED_TEXT_HEIGHT) break;
                    var xrender: i32 = @intFromFloat(xpos + xoff);
                    var xatlas = packed_char.packed_char.x0;
                    while (xatlas < xatlas_end) {
                        if (xrender >= RENDERED_TEXT_WIDTH) break;
                        self.rendered_text[@intCast(yrender * RENDERED_TEXT_WIDTH + xrender)] |= font.atlas[@intCast(yatlas * font.atlas_size.x + xatlas)];

                        xrender += 1;
                        xatlas += 1;
                    }
                    yrender += 1;
                    yatlas += 1;
                }
            }

            // TODO: Support newline character.

            xpos += xadv;
            const next_char_maybe = utf8_iter.peek(1);
            if (next_char_maybe.len > 0) {
                const next_char = std.unicode.utf8Decode(next_char_maybe) catch return AgentError.IncorrectUnicode;
                const kern = @as(f32, @floatFromInt(get_glyph_kern_advance(&font.font_info, char, next_char))) * scale;
                xpos += kern;
            }
        }
    }

    pub fn deinit(self: *Agent) void {
        if (self.font) |font| self.unload_font(font);
        self.allocator.free(self.rendered_text);
        self.allocator.destroy(self);
    }

    pub fn clear_rendered_text(self: *Agent) void {
        var i: usize = 0;
        while (i < RENDERED_TEXT_WIDTH * RENDERED_TEXT_HEIGHT) {
            self.rendered_text[i] = 0;
            i += 1;
        }
    }
};

// TODO: Not an exhaustive list. https://en.wikipedia.org/wiki/Whitespace_character
const whitespace = [_]u21{
    ' ',
    '\t',
    '\n',
    '\r',
    std.ascii.control_code.vt,
    std.ascii.control_code.ff,
};

// Stolen directly from std.ascii.isWhitespace
fn isWhitespace(codepoint: u21) bool {
    return for (whitespace) |other| {
        if (codepoint == other) break true;
    } else false;
}

test "Agent" {
    const stbi_write_png = @cImport(@cInclude("stb/stb_image_write.h")).stbi_write_png;
    const alloc = std.testing.allocator;

    const agent = try Agent.init(alloc);
    defer agent.deinit();

    const font_data = @embedFile("./DigitaltsLime.ttf");

    const font = try agent.load_font(font_data);

    const atlas_size = font.atlas_size;
    _ = stbi_write_png("font.png", atlas_size.x, atlas_size.y, 1, font.atlas.ptr, 0);

    const text = "Víztükör fúrógép őr?";
    try agent.render_text(text);

    _ = stbi_write_png("text.png", RENDERED_TEXT_WIDTH, RENDERED_TEXT_HEIGHT, 1, agent.rendered_text.ptr, 0);
}
