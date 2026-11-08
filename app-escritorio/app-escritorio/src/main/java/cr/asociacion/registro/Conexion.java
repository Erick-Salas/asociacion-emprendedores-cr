package cr.asociacion.registro;

import java.io.FileInputStream;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class Conexion {

    private static final String ARCHIVO_CONFIG = "config.properties";

    public static Connection obtener() throws SQLException {
        Properties props = new Properties();
        try (FileInputStream in = new FileInputStream(ARCHIVO_CONFIG)) {
            props.load(in);
        } catch (IOException e) {
            throw new SQLException("No se pudo leer " + ARCHIVO_CONFIG
                    + " (debe estar en la carpeta desde donde se ejecuta la app).", e);
        }

        String url = "jdbc:mysql://" + props.getProperty("db.host", "localhost")
                + ":" + props.getProperty("db.port", "3306")
                + "/" + props.getProperty("db.name")
                + "?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";

        return DriverManager.getConnection(
                url,
                props.getProperty("db.user"),
                props.getProperty("db.password"));
    }
}