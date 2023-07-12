// swift-tools-version: 5.6
import PackageDescription

let package = Package(
    name: "TreeSitterOrg",
    platforms: [.macOS(.v10_13), .iOS(.v11)],
    products: [.library(name: "TreeSitterOrg", targets: ["TreeSitterOrg"])],
    targets: [
        .target(
            name: "TreeSitterOrg",
            path: ".",
            exclude: [
            ],
            sources: [
                "src/parser.c",
                "src/scanner.c",
            ],
            resources: [
                .copy("queries"),
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
    ]
)
