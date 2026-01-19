import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const retreatId = parseInt(params.id);
    if (isNaN(retreatId)) {
      return NextResponse.json(
        { error: "Invalid retreat ID" },
        { status: 400 }
      );
    }

    // Verify retreat exists
    const retreat = await prisma.retreat.findUnique({
      where: { id: retreatId },
    });

    if (!retreat) {
      return NextResponse.json({ error: "Retreat not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV file" },
        { status: 400 }
      );
    }

    // Read and parse CSV file using papaparse
    const text = await file.text();

    // Parse CSV with papaparse (handles quoted fields, newlines, escaped quotes automatically)
    const parseResult = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      const errorMessages = parseResult.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { error: `CSV parsing errors: ${errorMessages}` },
        { status: 400 }
      );
    }

    const rows = parseResult.data;

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV must have at least a header row and one data row" },
        { status: 400 }
      );
    }

    // Parse header row
    const headers = rows[0].map((h) => (h || "").trim().toLowerCase());

    // Find column indices (support various header names)
    const titleIndex = headers.findIndex(
      (h) => h.includes("title") || h.includes("name") || h.includes("duty")
    );
    const descriptionIndex = headers.findIndex(
      (h) =>
        h.includes("description") || h.includes("desc") || h.includes("details")
    );

    if (titleIndex === -1) {
      return NextResponse.json(
        { error: "CSV must have a 'title' or 'name' column" },
        { status: 400 }
      );
    }

    // Parse data rows
    const duties = [];
    const errors = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];

      const title = values[titleIndex]?.trim();
      const description =
        descriptionIndex !== -1 ? values[descriptionIndex]?.trim() : null;

      if (!title) {
        errors.push(`Row ${i + 1}: Missing title`);
        continue;
      }

      duties.push({
        title,
        description: description || null,
      });
    }

    if (errors.length > 0 && duties.length === 0) {
      return NextResponse.json(
        { error: "No valid duties found", details: errors },
        { status: 400 }
      );
    }

    // Create duties in database
    const createdDuties = await prisma.$transaction(
      duties.map((duty) =>
        prisma.duty.create({
          data: {
            retreatId,
            title: duty.title,
            description: duty.description,
            status: "PENDING",
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      created: createdDuties.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("CSV upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload CSV" },
      { status: 500 }
    );
  }
}
