package uk.co.electronstudio.mobcontrol;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.server.handler.DefaultHandler;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.websocket.servlet.WebSocketServlet;
import org.eclipse.jetty.websocket.servlet.WebSocketServletFactory;

import java.awt.*;
import java.net.URI;
import java.util.logging.Level;

import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.StdErrLog;

public class HttpServer {
    final Server server;

    public static void main(String[] args) throws Exception {
        HttpServer server = new HttpServer();
        server.start();
        Desktop.getDesktop().browse(new URI("http://localhost"));
        server.waitForFinish();
    }

    public HttpServer() {
        StdErrLog logger = new StdErrLog();
        logger.setLevel(StdErrLog.LEVEL_INFO);
        Log.setLog(logger);

        ServletContextHandler servletHandler = new ServletContextHandler(ServletContextHandler.SESSIONS);
        servletHandler.setContextPath("/");
        ServletHolder holderEvents = new ServletHolder("ws-events", Servlet.class);
        servletHandler.addServlet(holderEvents, "/mobcontrol/*");

        ResourceHandler resourceHandler = new ResourceHandler();
        resourceHandler.setDirectoriesListed(true);
        resourceHandler.setWelcomeFiles(new String[]{"index.html"});
        resourceHandler.setResourceBase("client");

        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[]{resourceHandler, servletHandler});


        server = new Server();
        ServerConnector connector = new ServerConnector(server);
        connector.setPort(80);
        server.addConnector(connector);
        server.setHandler(handlers);
    }

    public void start() {
        try {

            server.start();
            //server.dump(System.err);

        } catch (Throwable t) {
            t.printStackTrace(System.err);
        }
    }

    public void waitForFinish() {
        try {
            server.join();
        } catch (Throwable t) {
            t.printStackTrace(System.err);
        }
    }

    public static class Servlet extends WebSocketServlet {
        @Override
        public void configure(WebSocketServletFactory factory) {
            factory.register(WebSocket.class);
        }
    }


}
