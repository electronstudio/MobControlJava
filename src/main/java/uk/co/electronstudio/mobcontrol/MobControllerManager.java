package uk.co.electronstudio.mobcontrol;



import com.badlogic.gdx.controllers.Controller;
import com.badlogic.gdx.controllers.ControllerListener;
import com.badlogic.gdx.controllers.PovDirection;
import com.badlogic.gdx.utils.Array;

import java.util.concurrent.ConcurrentLinkedQueue;


/*
 * Doesnt need to implement ControllerManager because it's only ever going
 * to be an additional source of controllers, never the global LibGDX ControllerManager.
 * But makes sense to keep parity with ControllerManager features if we can.
 */

public class MobControllerManager {

    private final Array<Controller> controllers = new Array<>();
    private final Array<ControllerListener> listeners = new Array<>();
    ConcurrentLinkedQueue<MobController> connectionQueue = new ConcurrentLinkedQueue<>();
    ConcurrentLinkedQueue<MobController> disConnectionQueue = new ConcurrentLinkedQueue<>();

    private final HttpServer server;

    private boolean running = true;

    public MobControllerManager() {
        WebSocket.mobControllerManager = this;
        server = new HttpServer();
        server.start();
    }


    public void pollState(){
        MobController c;
        while ((c = connectionQueue.poll()) != null) {
            connected(c);
        }

        MobController d;
        while ((d = disConnectionQueue.poll()) != null) {
            disconnected(d);
        }

        for (Controller controller: controllers) {
            ((MobController)controller).pollState();
        }
    }


    public Array<Controller> getControllers() {
        return controllers;
    }


    public void addListener(ControllerListener listener) {
        listeners.add(listener);
    }

    public void addListenerAndRunForConnectedControllers(ControllerListener listener){
        for(Controller controller : controllers){
            listener.connected(controller);
        }
        addListener(listener);
    }


    public void removeListener(ControllerListener listener) {
        listeners.removeValue(listener, true);
    }


    public void clearListeners() {
        listeners.clear();
    }

    private void connected(MobController controller) {
        System.out.println("connected " + controller);
        controllers.add(controller);
        for (ControllerListener listener : listeners) {
            listener.connected(controller);
        }
    }

    private void disconnected(MobController controller) {
        System.out.println("disconnected " + controller);
        controllers.removeValue(controller, true);
        for (ControllerListener listener : listeners) {
            listener.disconnected(controller);
        }
        controller.close();
    }

    void axisChanged(MobController controller, int axisCode, float value) {
        for (ControllerListener listener : listeners) {
            listener.axisMoved(controller, axisCode, value);
        }
    }

    void buttonChanged(MobController controller, int buttonCode, boolean value) {
        for (ControllerListener listener : listeners) {
            if (value) {
                listener.buttonDown(controller, buttonCode);
            } else {
                listener.buttonUp(controller, buttonCode);
            }
        }
    }

    void hatChanged(MobController controller, int hatCode, PovDirection value) {
        for (ControllerListener listener : listeners) {
            listener.povMoved(controller, hatCode, value);
        }
    }


    public Array<ControllerListener> getListeners() {
        return listeners;
    }

    public void close(){
        running=false;
        try {
            server.server.stop();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
