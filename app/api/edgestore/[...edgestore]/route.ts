import { getSession } from "../../../../lib/session"
import { initEdgeStore } from "@edgestore/server"
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app"
import { NextRequest, NextResponse } from "next/server"

const es = initEdgeStore.create()

const edgeStoreRouter = es.router({
    myPublicImage: es
        .imageBucket({
            maxSize: 0.293 * 1024 * 1024, //0.293 MB
            accept: ['image/jpeg', 'image/png']
        })
        .beforeDelete(({ ctx, fileInfo }) => {
            console.log('beforeDelete', ctx, fileInfo);
            return true; // allow delete
        }),
})

export async function GET() {
    return NextResponse.json({ error: "405 Method Not Allowed" }, { status: 405 })
}

export async function POST(request: NextRequest) {
    const session = await getSession()

    if (!session) {
        return NextResponse.json({ error: "Error: Unauthorized" }, { status: 401 })
    }

    if (request.nextUrl.pathname === "/api/edgestore/request-upload") {
        if (session && session?.user?.username === "root") {
            return NextResponse.json( {error: "Unauthorized"}, {status: 403})
        }
    }

    return createEdgeStoreNextHandler({ router: edgeStoreRouter })(request)
}

export type EdgeStoreRouter = typeof edgeStoreRouter