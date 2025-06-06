import SwiftUI
import SwiftUIReactNative
import React // For potential RCTBridge access if needed later

// ObservableObject to hold props from React Native
@objc class InterspaceSheetHostProps: NSObject, ObservableObject {
    @Published var isPresented: Bool = false
    @Published var rnViewTag: NSNumber? = nil // For hosting RN content later
    var onDismiss: (() -> Void)? = nil
    var onRNViewRendered: ((NSNumber?) -> Void)? = nil // Callback to send child tag to RN

    // Initializer to accept a dictionary from React Native
    // Props will be set by the ViewManager or bridge.
    // This is a common pattern but might need adjustment based on swiftui-react-native specifics.
    @objc func configure(with dict: [String: Any]) {
        if let presented = dict["isPresented"] as? Bool {
            self.isPresented = presented
        }
        if let tag = dict["rnViewTag"] as? NSNumber {
            self.rnViewTag = tag
        }
        // onDismiss would be set via a different mechanism, likely when the native view is created.
    }
}

struct InterspaceSheetHostView: View {
    // This will be provided by the hosting environment (e.g., a UIHostingController
    // whose rootView is this InterspaceSheetHostView, and this object is injected).
    // Or, if SwiftUIReactNative has a direct component model, it might inject this.
    @ObservedObject var props: InterspaceSheetHostProps
    
    // Local state to drive the sheet, distinct from the prop to allow SwiftUI to manage its presentation lifecycle.
    // We'll use .onChange to sync with props.isPresented.
    @State private var showSheet: Bool = false

    var body: some View {
        // This view itself is effectively a controller; it doesn't render primary UI directly,
        // but presents the sheet. It needs to exist in the hierarchy.
        Color.clear // Occupy space but be invisible
            .frame(width: 0, height: 0) // Ensure it doesn't disrupt layout
            .onAppear {
                // Sync initial state
                self.showSheet = props.isPresented
            }
            .onChange(of: props.isPresented) { newValue in
                // Update local state when prop changes
                self.showSheet = newValue
            }
            .sheet(isPresented: $showSheet, onDismiss: {
                // When sheet is dismissed by gesture or programmatically from SwiftUI:
                // 1. Update the prop so RN knows.
                // 2. Call the onDismiss callback.
                if props.isPresented { // Avoid redundant calls if already in sync
                    props.isPresented = false
                }
                props.onDismiss?()
            }) {
                // Content of the Sheet
                SheetContentView(props: props) // Pass props down if needed by content view
            }
    }
}

struct SheetContentView: View {
    @ObservedObject var props: InterspaceSheetHostProps // Access props for rnViewTag

    var body: some View {
        VStack {
            // Placeholder for where the React Native view will be embedded
            // using a component from SwiftUIReactNative, e.g., RNView(tag: props.rnViewTag)
            if let tag = props.rnViewTag {
                // This is where the magic of SwiftUIReactNative comes in.
                // We need its component that takes a reactTag (NSNumber) and renders the RN view.
                // For example, if the library provides `ReactView`:
                // ReactView(tag: tag)
                //    .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Placeholder until we confirm the exact component and usage:
                Text("SwiftUI Sheet: RN Content (tag: \(tag.intValue)) Placeholder")
                    .padding()
            } else {
                Text("SwiftUI Sheet: No RN Content Tag Provided")
                    .padding()
            }

            Button("Dismiss (Test Button in Swift)") {
                props.isPresented = false // This should trigger onDismiss via the chain
            }
            .padding()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground)) // Standard sheet background
        .presentationDetents([.height(UIScreen.main.bounds.height * 0.6), .large]) // Example snap points: 60% and full height
        .presentationDragIndicator(.visible)
    }
}


// --- Registration (This part is CRITICAL and needs to be done correctly) ---
// How SwiftUIReactNative makes `InterspaceSheetHostView` usable from JS.
// This usually involves creating an RCTViewManager or using a registration API from the library.

// Example: If SwiftUIReactNative uses a custom ViewManager approach:
// You would need to create an Objective-C or Swift class that subclasses RCTViewManager.
// This manager would be responsible for creating and updating the InterspaceSheetHostView.

// @objc(InterspaceSheetViewManager)
// class InterspaceSheetViewManager: RCTViewManager {
//     override func view() -> UIView! {
//         let props = InterspaceSheetHostProps()
//         let swiftUIView = InterspaceSheetHostView(props: props)
//         let hostingController = UIHostingController(rootView: swiftUIView)
//
//         // Store props on the hostingController's view so we can update it
//         // This is a common pattern but can be tricky.
//         // We also need to ensure the `props` object is retained and updated.
//         // A better way might be if SwiftUIReactNative provides a specific hosting view.
//         objc_setAssociatedObject(hostingController.view, "props", props, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
//
//         return hostingController.view
//     }

//     override static func moduleName() -> String! {
//         "InterspaceSheetHost" // This is the name used in React Native
//     }

//     override static func requiresMainQueueSetup() -> Bool {
//         return true
//     }

//     // Expose props from React Native to Swift
//     // This is the old way; swiftui-react-native might have a more modern approach.
//     @objc func setIsPresented(_ view: UIView, value: Bool) {
//         if let props = objc_getAssociatedObject(view, "props") as? InterspaceSheetHostProps {
//             props.isPresented = value
//         }
//     }

//     @objc func setRnViewTag(_ view: UIView, value: NSNumber?) {
//        if let props = objc_getAssociatedObject(view, "props") as? InterspaceSheetHostProps {
//            props.rnViewTag = value
//        }
//     }
    
//     // This is how you might expose an onDismiss event to JS
//     override func supportedEvents() -> [String]! {
//         return ["onSheetDismiss"]
//     }
//
//     // Then, in InterspaceSheetHostProps, when onDismiss is set:
//     // self.onDismiss = { [weak view] in
//     //   (view?.bridge?.eventDispatcher() as? RCTEventDispatcher)?.sendEvent(...)
//     // }
// }

// A more modern approach might involve SwiftUIReactNative providing a protocol
// like `ViewComponent` that InterspaceSheetHostView conforms to, and then registering it:
//
// In your AppDelegate.swift or a new Swift file (e.g., SwiftUIComponents.swift):
/*
import SwiftUIReactNative

@objc(SwiftUIComponents)
class SwiftUIComponents: NSObject {
  @objc(register)
  static func register() {
    // Assuming 'CustomSwiftUIView' is the component provided by swiftui-react-native
    // to host custom SwiftUI views by name.
    // And assuming InterspaceSheetHostView conforms to a protocol like 'RegisteredSwiftUIView'.
    // The actual API call will depend on the library.
    // For example:
    // CustomSwiftUIView.register(name: "InterspaceSheetHost", view: InterspaceSheetHostView.self)
    
    // Or, if it uses a ViewComponent pattern:
    // Registry.register(component: InterspaceSheetHostView.self, name: "InterspaceSheetHost")
    print("Attempting to register SwiftUI components for Interspace")
  }
}
*/
// Then you would call SwiftUIComponents.register() from your AppDelegate.
